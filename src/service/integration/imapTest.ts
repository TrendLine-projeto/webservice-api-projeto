import { createImapClient } from '../../integration/gmail/gmailClient';
import * as imapConfigService from './imapConfig';

type TestPayload = {
  cliente_id: any;
  config_id?: any;
  host?: any;
  port?: any;
  secure?: any;
  user_email?: any;
  password_encrypted?: any;
  mailbox?: any;
};

type ResolvedConfig = {
  host: string;
  port: number;
  secure: boolean;
  userEmail: string;
  password: string;
  mailbox: string;
};

const toBool = (value: any, fallback: boolean) => {
  if (value === undefined || value === null || value === '') return fallback;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value === 1;
  return ['true', '1', 'yes', 'sim'].includes(String(value).toLowerCase());
};

const toNumber = (value: any, fallback: number) => {
  if (value === undefined || value === null || value === '') return fallback;
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const toText = (value: any, fallback: string | undefined) => {
  if (value === undefined || value === null) return fallback;
  const text = String(value).trim();
  return text ? text : fallback;
};

const withTimeout = async <T>(promise: Promise<T>, ms: number, label: string) => {
  if (!ms || ms <= 0) return promise;

  let timeoutId: NodeJS.Timeout | null = null;
  const timeoutPromise = new Promise<T>((_resolve, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`${label} timeout after ${ms}ms`));
    }, ms);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
};

const resolveConfig = async (payload: TestPayload): Promise<ResolvedConfig> => {
  const clienteId = Number(payload?.cliente_id);
  if (!clienteId || Number.isNaN(clienteId)) {
    throw { tipo: 'Validacao', mensagem: 'cliente_id e obrigatorio.' };
  }

  let config: any = null;
  const configId = payload?.config_id !== undefined ? Number(payload.config_id) : null;

  if (configId && !Number.isNaN(configId)) {
    config = await imapConfigService.buscarPorId(configId);
    if (config?.cliente_id && Number(config.cliente_id) !== clienteId) {
      throw { tipo: 'Validacao', mensagem: 'cliente_id nao corresponde a configuracao informada.' };
    }
  }

  const host = toText(payload.host, config?.host);
  const userEmail = toText(payload.user_email, config?.user_email);
  const password = toText(payload.password_encrypted, config?.password_encrypted);
  const mailbox = toText(payload.mailbox, config?.mailbox || 'INBOX') || 'INBOX';
  const port = toNumber(payload.port, config?.port ?? 993);
  const secure = toBool(payload.secure, config?.secure ?? true);

  if (!host) {
    throw { tipo: 'Validacao', mensagem: 'host e obrigatorio.' };
  }
  if (!userEmail) {
    throw { tipo: 'Validacao', mensagem: 'user_email e obrigatorio.' };
  }
  if (!password) {
    throw { tipo: 'Validacao', mensagem: 'password_encrypted e obrigatorio.' };
  }

  return {
    host,
    port,
    secure,
    userEmail,
    password,
    mailbox,
  };
};

export const testarConexaoImap = async (payload: TestPayload) => {
  const config = await resolveConfig(payload);
  const client = createImapClient({
    host: config.host,
    port: config.port,
    secure: config.secure,
    user: config.userEmail,
    password: config.password,
  });

  let lock: any = null;

  try {
    await withTimeout(client.connect(), 15000, 'connect');
    lock = await withTimeout(client.getMailboxLock(config.mailbox), 15000, 'mailbox');
    return {
      host: config.host,
      mailbox: config.mailbox,
      user_email: config.userEmail,
    };
  } catch (error: any) {
    throw {
      tipo: 'Conexao',
      mensagem: error?.message || 'Falha ao conectar no IMAP.',
    };
  } finally {
    if (lock) {
      try {
        lock.release();
      } catch {
        // ignore lock release errors
      }
    }
    await client.logout().catch(() => undefined);
  }
};
