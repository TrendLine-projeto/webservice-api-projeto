import crypto from 'crypto';
import { simpleParser, Attachment } from 'mailparser';
import { createImapClient } from '../../integration/gmail/gmailClient';
import * as gmailXmlModel from '../../models/integrationsGmailXml';
import { processarXmlParaLote } from './xmlLoteImport';
import * as imapConfigService from './imapConfig';

type ImportResumo = {
  totalMensagens: number;
  processadas: number;
  novas: number;
  duplicadas: number;
  semXml: number;
  erros: number;
};

type ImportDetalhe = {
  config_id: number;
  resumo?: ImportResumo;
  erro?: string;
};

type ImapRuntimeConfig = {
  clienteId: number;
  host: string;
  port: number;
  secure: boolean;
  userEmail: string;
  password: string;
  mailbox: string;
  sinceDays: number;
  unseenOnly: boolean;
  markSeen: boolean;
  fromFilter?: string | null;
  subjectContains?: string | null;
  maxResults: number;
  parseTimeoutMs: number;
  storePassword: boolean;
};

const toMysqlDateTime = (date: Date) => date.toISOString().slice(0, 19).replace('T', ' ');

const normalizePassword = (value: any, host: string) => {
  const raw = value === undefined || value === null ? '' : String(value);
  const trimmed = raw.trim();
  // Gmail app password pode vir com espacos no meio.
  if (/gmail\.com$/i.test(host) || /googlemail\.com$/i.test(host)) {
    return trimmed.replace(/\s+/g, '');
  }
  return trimmed;
};

const normalizeSinceDays = (value: number) => {
  if (!Number.isFinite(value)) return 30;
  if (value <= 0) return 30;
  return Math.floor(value);
};

const normalizeMaxResults = (value: number) => {
  if (!Number.isFinite(value)) return 0;
  if (value < 0) return 0;
  return Math.floor(value);
};

const normalizeFilter = (value: string) => value.trim();

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

const isXmlAttachment = (attachment: { filename?: string | null; contentType?: string }) => {
  const filename = (attachment.filename ?? '').toLowerCase();
  const contentType = (attachment.contentType ?? '').toLowerCase();
  return filename.endsWith('.xml') || contentType.includes('xml');
};

const buildSearchCriteria = (config: ImapRuntimeConfig) => {
  const sinceDays = normalizeSinceDays(config.sinceDays);
  const criteria: Record<string, any> = {
    since: new Date(Date.now() - sinceDays * 24 * 60 * 60 * 1000),
  };

  if (config.unseenOnly) {
    criteria.seen = false;
  }

  const fromFilter = normalizeFilter(config.fromFilter || '');
  if (fromFilter) {
    criteria.from = fromFilter;
  }

  const subjectFilter = normalizeFilter(config.subjectContains || '');
  if (subjectFilter) {
    criteria.subject = subjectFilter;
  }

  return criteria;
};

const mapConfig = (config: any): ImapRuntimeConfig => ({
  clienteId: Number(config.cliente_id),
  host: String(config.host),
  port: Number(config.port || 993),
  secure: !!config.secure,
  userEmail: String(config.user_email),
  password: normalizePassword(config.password_encrypted, String(config.host)),
  mailbox: String(config.mailbox || 'INBOX'),
  sinceDays: Number(config.since_days || 30),
  unseenOnly: !!config.unseen_only,
  markSeen: !!config.mark_seen,
  fromFilter: config.from_filter ?? null,
  subjectContains: config.subject_contains ?? null,
  maxResults: Number(config.max_results || 0),
  parseTimeoutMs: Number(config.parse_timeout_ms || 0),
  storePassword: !!config.store_password,
});

const somarResumo = (total: ImportResumo, parcial: ImportResumo) => {
  total.totalMensagens += parcial.totalMensagens;
  total.processadas += parcial.processadas;
  total.novas += parcial.novas;
  total.duplicadas += parcial.duplicadas;
  total.semXml += parcial.semXml;
  total.erros += parcial.erros;
};

export const importarGmailXmlTodas = async (clienteId: number) => {
  if (!clienteId || Number.isNaN(clienteId)) {
    const error: any = new Error('cliente_id e obrigatorio');
    error.status = 400;
    throw error;
  }

  const configs = await imapConfigService.buscarAtivasPorCliente(clienteId);
  if (!configs.length) {
    const error: any = new Error('Configuracao IMAP ativa nao encontrada.');
    error.status = 404;
    throw error;
  }

  const resumoTotal: ImportResumo = {
    totalMensagens: 0,
    processadas: 0,
    novas: 0,
    duplicadas: 0,
    semXml: 0,
    erros: 0,
  };
  const detalhes: ImportDetalhe[] = [];

  for (const config of configs) {
    try {
      const resumo = await importarGmailXml(clienteId, Number(config.id));
      somarResumo(resumoTotal, resumo);
      detalhes.push({ config_id: Number(config.id), resumo });
    } catch (error: any) {
      resumoTotal.erros += 1;
      detalhes.push({
        config_id: Number(config.id),
        erro: error?.message ? String(error.message) : 'Erro ao importar configuracao',
      });
    }
  }

  return {
    resumo: resumoTotal,
    detalhes,
    totalConfiguracoes: configs.length,
  };
};

export const importarGmailXml = async (
  clienteId: number,
  configId?: number
): Promise<ImportResumo> => {
  if (!clienteId || Number.isNaN(clienteId)) {
    const error: any = new Error('cliente_id e obrigatorio');
    error.status = 400;
    throw error;
  }

  const configRaw = configId
    ? await imapConfigService.buscarPorId(configId)
    : await imapConfigService.buscarAtivaPorCliente(clienteId);
  const config = mapConfig(configRaw);
  const debug = process.env.INTEGRATION_DEBUG === 'true';

  if (config.clienteId !== clienteId) {
    const error: any = new Error('cliente_id nao corresponde a configuracao informada');
    error.status = 400;
    throw error;
  }

  if (debug) {
    const maskedPassword = config.password ? `${'*'.repeat(Math.max(config.password.length - 2, 0))}${config.password.slice(-2)}` : '';
    console.log('[imap-import] auth config', {
      clienteId: config.clienteId,
      configId: configId ?? null,
      host: config.host,
      port: config.port,
      secure: config.secure,
      userEmail: config.userEmail,
      mailbox: config.mailbox,
      sinceDays: config.sinceDays,
      unseenOnly: config.unseenOnly,
      markSeen: config.markSeen,
      fromFilter: config.fromFilter || null,
      subjectContains: config.subjectContains || null,
      maxResults: config.maxResults || null,
      parseTimeoutMs: config.parseTimeoutMs || null,
      storePassword: config.storePassword,
      passwordLen: config.password?.length || 0,
      passwordMasked: maskedPassword,
    });
  }

  const client = createImapClient({
    host: config.host,
    port: config.port,
    secure: config.secure,
    user: config.userEmail,
    password: config.password,
  });
  await client.connect();
  const lock = await client.getMailboxLock(config.mailbox);

  const criteria = buildSearchCriteria(config);
  const searchResult = await client.search(criteria);
  let messageUids = Array.isArray(searchResult) ? searchResult : [];
  const maxResults = normalizeMaxResults(config.maxResults);

  if (maxResults && messageUids.length > maxResults) {
    messageUids = messageUids.slice(-maxResults);
  }

  const resumo: ImportResumo = {
    totalMensagens: messageUids.length,
    processadas: 0,
    novas: 0,
    duplicadas: 0,
    semXml: 0,
    erros: 0,
  };
  const uidsToMarkSeen = new Set<number>();

  try {
    if (debug) {
      console.log('[imap-import] filtros', {
        mailbox: config.mailbox,
        sinceDays: config.sinceDays,
        unseenOnly: config.unseenOnly,
        from: config.fromFilter || null,
        subject: config.subjectContains || null,
        maxResults: maxResults || null,
      });
      console.log('[imap-import] mensagens encontradas', messageUids.length);
    }

    if (!messageUids.length) {
      return resumo;
    }

    for await (const message of client.fetch(messageUids, {
      uid: true,
      envelope: true,
      size: true,
      source: true,
    })) {
      const messageId =
        message.envelope?.messageId?.toString() || `imap:${message.uid ?? 'unknown'}`;
      const messageUid = message.uid;
      if (config.markSeen && messageUid) {
        uidsToMarkSeen.add(messageUid);
      }

      const jaExiste = await gmailXmlModel.existeMensagem(config.clienteId, messageId);
      if (jaExiste) {
        resumo.duplicadas += 1;
        continue;
      }

      try {
        if (!message.source) {
          throw new Error('Mensagem sem conteudo (source vazio).');
        }

        if (debug) {
          console.log('[imap-import] parse start', {
            messageId,
            uid: messageUid,
            size: message.size || null,
          });
        }

        const parsed = await withTimeout(
          simpleParser(message.source as Buffer),
          config.parseTimeoutMs,
          'parse'
        );

        if (debug) {
          console.log('[imap-import] parse done', { messageId });
        }
        const attachments = parsed.attachments || [];
        const xmlAttachment = attachments.find((att: Attachment) => isXmlAttachment(att));
        const receivedDate = parsed.date || message.envelope?.date || null;
        const receivedAt = receivedDate ? toMysqlDateTime(receivedDate) : null;
        const storedSecret = config.storePassword ? config.password : '';
        const subject = parsed.subject || '(sem assunto)';
        const fromText = parsed.from?.text || '(sem remetente)';

        if (debug) {
          console.log('[imap-import] mensagem', {
            messageId,
            subject,
            from: fromText,
            anexos: attachments.length,
            temXml: Boolean(xmlAttachment),
          });
        }

        if (!xmlAttachment || !xmlAttachment.content) {
          await gmailXmlModel.inserirImportacao({
            clienteId: config.clienteId,
            emailGoogle: config.userEmail,
            refreshToken: storedSecret,
            scopes: 'imap',
            gmailMessageId: messageId,
            receivedAt,
            status: 'no_xml',
            error: null,
            xmlHash: null,
            xmlRaw: null,
            parsedAt: null,
          });
          resumo.semXml += 1;
          resumo.novas += 1;
          resumo.processadas += 1;
          continue;
        }

        const xmlContent = xmlAttachment.content.toString('utf-8');
        const xmlHash = crypto.createHash('sha256').update(xmlContent).digest('hex');

        const importId = await gmailXmlModel.inserirImportacao({
          clienteId: config.clienteId,
          emailGoogle: config.userEmail,
          refreshToken: storedSecret,
          scopes: 'imap',
          gmailMessageId: messageId,
          receivedAt,
          status: 'imported',
          error: null,
          xmlHash,
          xmlRaw: xmlContent,
          parsedAt: null,
        });

        try {
          const loteResult = await processarXmlParaLote(xmlContent, config.clienteId, importId);
          await gmailXmlModel.atualizarParseStatus(importId, 'parsed_ok', null);
          if (debug) {
            console.log('[imap-import] lote criado', loteResult);
          }
        } catch (error: any) {
          const mensagem = error?.message ? String(error.message) : 'Erro ao processar XML';
          await gmailXmlModel.atualizarParseStatus(importId, 'parsed_error', mensagem);
          if (debug) {
            console.log('[imap-import] falha ao gerar lote', { messageId, erro: mensagem });
          }
        }

        resumo.novas += 1;
        resumo.processadas += 1;
      } catch (error: any) {
        resumo.erros += 1;
        resumo.processadas += 1;

        if (debug) {
          console.log('[imap-import] erro na mensagem', {
            messageId,
            erro: error?.message || error,
          });
        }

        try {
          await gmailXmlModel.inserirImportacao({
            clienteId: config.clienteId,
            emailGoogle: config.userEmail,
            refreshToken: '',
            scopes: 'imap',
            gmailMessageId: messageId,
            receivedAt: null,
            status: 'error',
            error: error?.message ? String(error.message) : 'Erro ao processar mensagem',
            xmlHash: null,
            xmlRaw: null,
            parsedAt: null,
          });
        } catch {
          // evita falha total por erro de persistencia
        }
      }
    }

    if (config.markSeen && uidsToMarkSeen.size) {
      const uids = Array.from(uidsToMarkSeen);
      try {
        await client.messageFlagsAdd(uids, ['\\Seen'], { uid: true });
        if (debug) {
          console.log('[imap-import] mensagens marcadas como lidas', { total: uids.length });
        }
      } catch (error: any) {
        if (debug) {
          console.log('[imap-import] falha ao marcar lidas em lote', {
            total: uids.length,
            erro: error?.message || error,
          });
        }
      }
    }

    return resumo;
  } finally {
    try {
      lock.release();
    } catch {
      // ignore lock release errors
    }
    await client.logout().catch(() => undefined);
  }
};
