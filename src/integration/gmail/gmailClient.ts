import { ImapFlow } from 'imapflow';

type ImapClientConfig = {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  password: string;
};

export const createImapClient = (config: ImapClientConfig) => {
  return new ImapFlow({
    host: config.host,
    port: config.port,
    secure: config.secure,
    logger: false,
    auth: {
      user: config.user,
      pass: config.password,
    },
  });
};
