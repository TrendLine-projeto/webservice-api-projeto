export const IMAP = {
  host: process.env.IMAP_HOST || '',
  port: Number(process.env.IMAP_PORT || 993),
  secure: process.env.IMAP_SECURE !== 'false',
  user: process.env.IMAP_USER || '',
  password: process.env.IMAP_PASSWORD || '',
  mailbox: process.env.IMAP_MAILBOX || 'INBOX',
  sinceDays: Number(process.env.IMAP_SINCE_DAYS || 30),
  unseenOnly: process.env.IMAP_UNSEEN_ONLY !== 'false',
  from: process.env.IMAP_FROM || '',
  subjectContains: process.env.IMAP_SUBJECT_CONTAINS || '',
  maxResults: Number(process.env.IMAP_MAX_RESULTS || 0),
  debug: process.env.INTEGRATION_DEBUG === 'true',
  markSeen: process.env.IMAP_MARK_SEEN !== 'false',
  parseTimeoutMs: Number(process.env.IMAP_PARSE_TIMEOUT_MS || 0),
};

export const INTEGRATION = {
  clienteId: Number(process.env.INTEGRATION_CLIENTE_ID || 0),
  emailGoogle: process.env.INTEGRATION_EMAIL || process.env.IMAP_USER || '',
  scopes: 'imap',
  storePassword: process.env.INTEGRATION_STORE_PASSWORD === 'true',
};

export const validateImapConfig = () => {
  const missing: string[] = [];

  if (!IMAP.host) missing.push('IMAP_HOST');
  if (!IMAP.port) missing.push('IMAP_PORT');
  if (!IMAP.user) missing.push('IMAP_USER');
  if (!IMAP.password) missing.push('IMAP_PASSWORD');
  if (!INTEGRATION.clienteId) missing.push('INTEGRATION_CLIENTE_ID');
  if (!INTEGRATION.emailGoogle) missing.push('INTEGRATION_EMAIL or IMAP_USER');

  if (missing.length) {
    const error: any = new Error('Config IMAP incompleta');
    error.status = 400;
    error.detalhes = missing;
    throw error;
  }
};
