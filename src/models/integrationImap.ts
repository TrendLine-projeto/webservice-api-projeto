import pool from '../connect/mysql';
import { PoolConnection, ResultSetHeader, RowDataPacket } from 'mysql2/promise';

export type ImapConfigInput = {
  cliente_id: number;
  host: string;
  port?: number;
  secure?: boolean;
  user_email: string;
  password_encrypted: string;
  mailbox?: string;
  since_days?: number;
  unseen_only?: boolean;
  mark_seen?: boolean;
  from_filter?: string | null;
  subject_contains?: string | null;
  max_results?: number;
  parse_timeout_ms?: number;
  store_password?: boolean;
  ativo?: boolean;
};

const mapRow = (row: any) => ({
  id: row.id,
  cliente_id: row.cliente_id,
  host: row.host,
  port: row.port,
  secure: !!row.secure,
  user_email: row.user_email,
  password_encrypted: row.password_encrypted,
  mailbox: row.mailbox,
  since_days: row.since_days,
  unseen_only: !!row.unseen_only,
  mark_seen: !!row.mark_seen,
  from_filter: row.from_filter,
  subject_contains: row.subject_contains,
  max_results: row.max_results,
  parse_timeout_ms: row.parse_timeout_ms,
  store_password: !!row.store_password,
  ativo: !!row.ativo,
  created_at: row.created_at,
  updated_at: row.updated_at,
});

export const inserirConfiguracao = async (config: ImapConfigInput) => {
  const conn: PoolConnection = await pool.getConnection();
  try {
    const query = `
      INSERT INTO integrations_imap (
        cliente_id,
        host,
        port,
        secure,
        user_email,
        password_encrypted,
        mailbox,
        since_days,
        unseen_only,
        mark_seen,
        from_filter,
        subject_contains,
        max_results,
        parse_timeout_ms,
        store_password,
        ativo
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      config.cliente_id,
      config.host,
      config.port ?? 993,
      config.secure ? 1 : 0,
      config.user_email,
      config.password_encrypted,
      config.mailbox ?? 'INBOX',
      config.since_days ?? 30,
      config.unseen_only ? 1 : 0,
      config.mark_seen ? 1 : 0,
      config.from_filter ?? null,
      config.subject_contains ?? null,
      config.max_results ?? 0,
      config.parse_timeout_ms ?? 0,
      config.store_password ? 1 : 0,
      config.ativo ? 1 : 0
    ];

    const [result] = await conn.query<ResultSetHeader>(query, values);
    return result.insertId;
  } finally {
    conn.release();
  }
};

export const buscarPorId = async (id: number) => {
  const conn: PoolConnection = await pool.getConnection();
  try {
    const query = `
      SELECT *
        FROM integrations_imap
       WHERE id = ?
       LIMIT 1
    `;
    const [rows] = await conn.query<RowDataPacket[]>(query, [id]);
    return rows[0] ? mapRow(rows[0]) : null;
  } finally {
    conn.release();
  }
};

export const buscarPorCliente = async (clienteId: number) => {
  const conn: PoolConnection = await pool.getConnection();
  try {
    const query = `
      SELECT *
        FROM integrations_imap
       WHERE cliente_id = ?
       ORDER BY id DESC
    `;
    const [rows] = await conn.query<RowDataPacket[]>(query, [clienteId]);
    return rows.map(mapRow);
  } finally {
    conn.release();
  }
};

export const buscarAtivaPorCliente = async (clienteId: number) => {
  const conn: PoolConnection = await pool.getConnection();
  try {
    const query = `
      SELECT *
        FROM integrations_imap
       WHERE cliente_id = ? AND ativo = 1
       ORDER BY id DESC
       LIMIT 1
    `;
    const [rows] = await conn.query<RowDataPacket[]>(query, [clienteId]);
    return rows[0] ? mapRow(rows[0]) : null;
  } finally {
    conn.release();
  }
};

export const buscarAtivasPorCliente = async (clienteId: number) => {
  const conn: PoolConnection = await pool.getConnection();
  try {
    const query = `
      SELECT *
        FROM integrations_imap
       WHERE cliente_id = ? AND ativo = 1
       ORDER BY id DESC
    `;
    const [rows] = await conn.query<RowDataPacket[]>(query, [clienteId]);
    return rows.map(mapRow);
  } finally {
    conn.release();
  }
};

export const atualizarPorId = async (id: number, dados: Partial<ImapConfigInput>) => {
  const conn: PoolConnection = await pool.getConnection();
  try {
    const mapaColunas: Record<string, string> = {
      cliente_id: 'cliente_id',
      host: 'host',
      port: 'port',
      secure: 'secure',
      user_email: 'user_email',
      password_encrypted: 'password_encrypted',
      mailbox: 'mailbox',
      since_days: 'since_days',
      unseen_only: 'unseen_only',
      mark_seen: 'mark_seen',
      from_filter: 'from_filter',
      subject_contains: 'subject_contains',
      max_results: 'max_results',
      parse_timeout_ms: 'parse_timeout_ms',
      store_password: 'store_password',
      ativo: 'ativo',
    };

    const sets: string[] = [];
    const params: any[] = [];

    Object.entries(dados).forEach(([campo, valor]) => {
      const coluna = mapaColunas[campo];
      if (!coluna) return;
      const valorFinal =
        typeof valor === 'boolean' ? (valor ? 1 : 0) : valor;
      sets.push(`\`${coluna}\` = ?`);
      params.push(valorFinal);
    });

    if (!sets.length) return { affectedRows: 0 };

    params.push(id);

    const query = `
      UPDATE integrations_imap
         SET ${sets.join(', ')}
       WHERE id = ?
       LIMIT 1
    `;
    const [result] = await conn.query<ResultSetHeader>(query, params);
    return { affectedRows: result.affectedRows };
  } finally {
    conn.release();
  }
};

export const desativarOutras = async (clienteId: number, ignoreId?: number) => {
  const conn: PoolConnection = await pool.getConnection();
  try {
    const query = `
      UPDATE integrations_imap
         SET ativo = 0
       WHERE cliente_id = ?
         AND (${ignoreId ? 'id <> ?' : '1=1'})
    `;
    const params = ignoreId ? [clienteId, ignoreId] : [clienteId];
    await conn.query<ResultSetHeader>(query, params);
  } finally {
    conn.release();
  }
};

export const deletarPorId = async (id: number) => {
  const conn: PoolConnection = await pool.getConnection();
  try {
    const query = `
      DELETE FROM integrations_imap
       WHERE id = ?
       LIMIT 1
    `;
    const [result] = await conn.query<ResultSetHeader>(query, [id]);
    return { affectedRows: result.affectedRows };
  } finally {
    conn.release();
  }
};
