import pool from '../connect/mysql';
import { PoolConnection, ResultSetHeader, RowDataPacket } from 'mysql2/promise';

export type GmailXmlImportInput = {
  clienteId: number;
  emailGoogle: string;
  refreshToken: string;
  scopes: string | null;
  gmailMessageId: string;
  receivedAt: string | null;
  status: string;
  error: string | null;
  xmlHash: string | null;
  xmlRaw: string | null;
  parsedAt: string | null;
};

export const existeMensagem = async (
  clienteId: number,
  gmailMessageId: string
): Promise<boolean> => {
  const conn: PoolConnection = await pool.getConnection();

  try {
    const query = `
      SELECT id
      FROM integrations_gmail_xml
      WHERE cliente_id = ? AND gmail_message_id = ?
      LIMIT 1
    `;
    const [rows] = await conn.query<RowDataPacket[]>(query, [clienteId, gmailMessageId]);
    return rows.length > 0;
  } finally {
    conn.release();
  }
};

export const inserirImportacao = async (payload: GmailXmlImportInput) => {
  const conn: PoolConnection = await pool.getConnection();

  try {
    const query = `
      INSERT INTO integrations_gmail_xml (
        cliente_id,
        email_google,
        refresh_token_encrypted,
        scopes,
        gmail_message_id,
        received_at,
        status,
        error,
        xml_hash,
        xml_raw,
        parsed_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      payload.clienteId,
      payload.emailGoogle,
      payload.refreshToken,
      payload.scopes,
      payload.gmailMessageId,
      payload.receivedAt,
      payload.status,
      payload.error,
      payload.xmlHash,
      payload.xmlRaw,
      payload.parsedAt,
    ];

    const [result] = await conn.query<ResultSetHeader>(query, values);
    return result.insertId;
  } finally {
    conn.release();
  }
};

export const atualizarParseStatus = async (
  id: number,
  parseStatus: string,
  error: string | null
) => {
  const conn: PoolConnection = await pool.getConnection();

  try {
    const query = `
      UPDATE integrations_gmail_xml
         SET status = ?,
             parsed_at = NOW(),
             error = ?
       WHERE id = ?
      LIMIT 1
    `;
    await conn.query<ResultSetHeader>(query, [parseStatus, error, id]);
  } finally {
    conn.release();
  }
};

export const buscarPorId = async (id: number) => {
  const conn: PoolConnection = await pool.getConnection();

  try {
    const query = `
      SELECT *
      FROM integrations_gmail_xml
      WHERE id = ?
      LIMIT 1
    `;
    const [rows] = await conn.query<RowDataPacket[]>(query, [id]);
    return rows[0] ?? null;
  } finally {
    conn.release();
  }
};
