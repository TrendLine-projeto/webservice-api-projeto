import pool from '../connect/mysql';
import { PoolConnection, ResultSetHeader } from 'mysql2/promise';
import { NotificacaoBase, NotificacaoRow, PaginacaoParams } from '../types/notificacoes/notificacoes';

const TABLE = 'notificacoes';

export const inserir = async (n: NotificacaoBase) => {
  const conn: PoolConnection = await pool.getConnection();
  try {
    const [result] = await conn.query<ResultSetHeader>(
      `
      INSERT INTO ${TABLE} (descricao, url, tipo, dataCriacao, idCliente)
      VALUES (?, ?, ?, ?, ?)
      `,
      [n.descricao, n.url, n.tipo, n.dataCriacao ?? new Date(), n.idCliente]
    );
    return result;
  } finally {
    conn.release();
  }
};

export const buscarPorId = async (id: number) => {
  const conn = await pool.getConnection();
  try {
    const [rows] = await conn.query<NotificacaoRow[]>(
      `SELECT * FROM ${TABLE} WHERE id = ?`,
      [id]
    );
    return rows[0] ?? null;
  } finally {
    conn.release();
  }
};

export const atualizar = async (id: number, n: NotificacaoBase) => {
  const conn = await pool.getConnection();
  try {
    const [result] = await conn.query<ResultSetHeader>(
      `
      UPDATE ${TABLE}
         SET descricao = ?, url = ?, tipo = ?, dataCriacao = ?, idCliente = ?
       WHERE id = ?
      `,
      [n.descricao, n.url, n.tipo, n.dataCriacao ?? null, n.idCliente, id]
    );
    return result.affectedRows > 0;
  } finally {
    conn.release();
  }
};

export const remover = async (id: number) => {
  const conn = await pool.getConnection();
  try {
    const [result] = await conn.query<ResultSetHeader>(
      `DELETE FROM ${TABLE} WHERE id = ?`,
      [id]
    );
    return result.affectedRows > 0;
  } finally {
    conn.release();
  }
};

export const listar = async (p: PaginacaoParams) => {
  const pagina = Math.max(Number(p.pagina ?? 1), 1);
  const limit = Math.max(Number(p.quantidadePorPagina ?? 10), 1);
  const offset = (pagina - 1) * limit;

  const filtros: string[] = [];
  const params: any[] = [];

  if (p.idCliente) { filtros.push(`idCliente = ?`); params.push(Number(p.idCliente)); }
  if (p.tipo) { filtros.push(`tipo = ?`); params.push(p.tipo); }
  if (p.busca) {
    filtros.push(`(descricao LIKE ? OR url LIKE ?)`); 
    const like = `%${p.busca}%`;
    params.push(like, like);
  }
  if (p.dataCriacaoDe) { filtros.push(`dataCriacao >= ?`); params.push(p.dataCriacaoDe); }
  if (p.dataCriacaoAte) { filtros.push(`dataCriacao <= ?`); params.push(p.dataCriacaoAte); }

  const where = filtros.length ? `WHERE ${filtros.join(' AND ')}` : '';

  const conn = await pool.getConnection();
  try {
    const [[{ total }]] = await conn.query<any[]>(
      `SELECT COUNT(*) AS total FROM ${TABLE} ${where}`,
      params
    );

    const [rows] = await conn.query<NotificacaoRow[]>(
      `
        SELECT *
          FROM ${TABLE}
          ${where}
      ORDER BY dataCriacao DESC, id DESC
         LIMIT ? OFFSET ?
      `,
      [...params, limit, offset]
    );

    return { total, pagina, quantidadePorPagina: limit, itens: rows };
  } finally {
    conn.release();
  }
};
