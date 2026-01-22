import * as imapModel from '../../models/integrationImap';

const toBool = (value: any, fallback: boolean) => {
  if (value === undefined || value === null || value === '') return fallback;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value === 1;
  return ['true', '1', 'yes', 'sim'].includes(String(value).toLowerCase());
};

const toNumber = (value: any, fallback: number) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

export const criarConfiguracao = async (payload: any) => {
  if (!payload?.cliente_id) {
    throw { tipo: 'Validacao', mensagem: 'cliente_id e obrigatorio.' };
  }
  if (!payload?.host) {
    throw { tipo: 'Validacao', mensagem: 'host e obrigatorio.' };
  }
  if (!payload?.user_email) {
    throw { tipo: 'Validacao', mensagem: 'user_email e obrigatorio.' };
  }
  if (!payload?.password_encrypted) {
    throw { tipo: 'Validacao', mensagem: 'password_encrypted e obrigatorio.' };
  }

  const config: imapModel.ImapConfigInput = {
    cliente_id: Number(payload.cliente_id),
    host: String(payload.host),
    port: toNumber(payload.port, 993),
    secure: toBool(payload.secure, true),
    user_email: String(payload.user_email),
    password_encrypted: String(payload.password_encrypted),
    mailbox: payload.mailbox ? String(payload.mailbox) : 'INBOX',
    since_days: toNumber(payload.since_days, 30),
    unseen_only: toBool(payload.unseen_only, true),
    mark_seen: toBool(payload.mark_seen, true),
    from_filter: payload.from_filter ? String(payload.from_filter) : null,
    subject_contains: payload.subject_contains ? String(payload.subject_contains) : null,
    max_results: toNumber(payload.max_results, 0),
    parse_timeout_ms: toNumber(payload.parse_timeout_ms, 0),
    store_password: toBool(payload.store_password, false),
    ativo: toBool(payload.ativo, true),
  };

  const insertId = await imapModel.inserirConfiguracao(config);

  if (config.ativo) {
    await imapModel.desativarOutras(config.cliente_id, insertId);
  }

  return { id: insertId, ...config };
};

export const buscarPorId = async (id: number) => {
  const config = await imapModel.buscarPorId(id);
  if (!config) {
    throw { tipo: 'NaoEncontrado', mensagem: 'Configuracao nao encontrada.' };
  }
  return config;
};

export const buscarPorCliente = async (clienteId: number) => {
  if (!clienteId) {
    throw { tipo: 'Validacao', mensagem: 'cliente_id e obrigatorio.' };
  }
  const configs = await imapModel.buscarPorCliente(clienteId);
  return { totalRegistros: configs.length, configuracoes: configs };
};

export const buscarAtivaPorCliente = async (clienteId: number) => {
  if (!clienteId) {
    throw { tipo: 'Validacao', mensagem: 'cliente_id e obrigatorio.' };
  }
  const config = await imapModel.buscarAtivaPorCliente(clienteId);
  if (!config) {
    throw { tipo: 'NaoEncontrado', mensagem: 'Configuracao IMAP ativa nao encontrada.' };
  }
  return config;
};

export const buscarAtivasPorCliente = async (clienteId: number) => {
  if (!clienteId) {
    throw { tipo: 'Validacao', mensagem: 'cliente_id e obrigatorio.' };
  }
  return await imapModel.buscarAtivasPorCliente(clienteId);
};

export const atualizarPorId = async (id: number, payload: any) => {
  if (!id) {
    throw { tipo: 'Validacao', mensagem: 'id e obrigatorio.' };
  }

  const dados: Partial<imapModel.ImapConfigInput> = {};
  if (payload.cliente_id !== undefined) dados.cliente_id = Number(payload.cliente_id);
  if (payload.host !== undefined) dados.host = String(payload.host);
  if (payload.port !== undefined) dados.port = toNumber(payload.port, 993);
  if (payload.secure !== undefined) dados.secure = toBool(payload.secure, true);
  if (payload.user_email !== undefined) dados.user_email = String(payload.user_email);
  if (payload.password_encrypted !== undefined) dados.password_encrypted = String(payload.password_encrypted);
  if (payload.mailbox !== undefined) dados.mailbox = String(payload.mailbox);
  if (payload.since_days !== undefined) dados.since_days = toNumber(payload.since_days, 30);
  if (payload.unseen_only !== undefined) dados.unseen_only = toBool(payload.unseen_only, true);
  if (payload.mark_seen !== undefined) dados.mark_seen = toBool(payload.mark_seen, true);
  if (payload.from_filter !== undefined) dados.from_filter = payload.from_filter ? String(payload.from_filter) : null;
  if (payload.subject_contains !== undefined) dados.subject_contains = payload.subject_contains ? String(payload.subject_contains) : null;
  if (payload.max_results !== undefined) dados.max_results = toNumber(payload.max_results, 0);
  if (payload.parse_timeout_ms !== undefined) dados.parse_timeout_ms = toNumber(payload.parse_timeout_ms, 0);
  if (payload.store_password !== undefined) dados.store_password = toBool(payload.store_password, false);
  if (payload.ativo !== undefined) dados.ativo = toBool(payload.ativo, true);

  const { affectedRows } = await imapModel.atualizarPorId(id, dados);
  if (affectedRows === 0) {
    throw { tipo: 'NaoEncontrado', mensagem: 'Configuracao nao encontrada.' };
  }

  if (dados.ativo && dados.cliente_id) {
    await imapModel.desativarOutras(dados.cliente_id, id);
  } else if (dados.ativo) {
    const config = await imapModel.buscarPorId(id);
    if (config?.cliente_id) {
      await imapModel.desativarOutras(config.cliente_id, id);
    }
  }

  return { id, ...dados };
};

export const deletarPorId = async (id: number) => {
  const { affectedRows } = await imapModel.deletarPorId(id);
  if (!affectedRows) {
    throw { tipo: 'NaoEncontrado', mensagem: 'Configuracao nao encontrada.' };
  }
  return { id, mensagem: 'Configuracao removida com sucesso.' };
};
