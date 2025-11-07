// src/models/manutencoesModel.ts
import pool from '../connect/mysql';
import { PoolConnection, ResultSetHeader } from 'mysql2/promise';
import { ManutencaoBase, ManutencaoRow, PaginacaoParams } from '../types/maquinas/manutencao_maquinas';

export const inserir = async (m: ManutencaoBase) => {
  const conn: PoolConnection = await pool.getConnection();
  try {
    const [result] = await conn.query<ResultSetHeader>(
      `
      INSERT INTO manutencao_maquinas (
        tipo, data_execucao, proxima_prevista, status, custo, responsavel, observacoes, idMaquina
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        m.tipo,
        m.data_execucao ?? null,
        m.proxima_prevista ?? null,
        m.status ?? null,
        m.custo ?? null,
        m.responsavel ?? null,
        m.observacoes ?? null,
        m.idMaquina,
      ]
    );
    return result;
  } finally {
    conn.release();
  }
};

export const buscarPorId = async (id: number) => {
  const conn = await pool.getConnection();
  try {
    const [rows] = await conn.query<ManutencaoRow[]>(
      `SELECT * FROM manutencao_maquinas WHERE id = ?`,
      [id]
    );
    return rows[0] ?? null;
  } finally {
    conn.release();
  }
};

export const atualizar = async (id: number, m: ManutencaoBase) => {
  const conn = await pool.getConnection();
  try {
    const [result] = await conn.query<ResultSetHeader>(
      `
      UPDATE manutencao_maquinas
         SET tipo = ?, data_execucao = ?, proxima_prevista = ?, status = ?,
             custo = ?, responsavel = ?, observacoes = ?, idMaquina = ?
       WHERE id = ?
      `,
      [
        m.tipo,
        m.data_execucao ?? null,
        m.proxima_prevista ?? null,
        m.status ?? null,
        m.custo ?? null,
        m.responsavel ?? null,
        m.observacoes ?? null,
        m.idMaquina,
        id,
      ]
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
      `DELETE FROM manutencao_maquinas WHERE id = ?`,
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

  if (p.idMaquina) { filtros.push(`idMaquina = ?`); params.push(Number(p.idMaquina)); }
  if (p.status) { filtros.push(`status = ?`); params.push(p.status); }
  if (p.tipo) { filtros.push(`tipo = ?`); params.push(p.tipo); }
  if (p.busca) {
    filtros.push(`(responsavel LIKE ? OR observacoes LIKE ?)`);
    const like = `%${p.busca}%`;
    params.push(like, like);
  }

  const where = filtros.length ? `WHERE ${filtros.join(' AND ')}` : '';

  const conn = await pool.getConnection();
  try {
    const [[{ total }]] = await conn.query<any[]>(
      `SELECT COUNT(*) AS total FROM manutencao_maquinas ${where}`,
      params
    );

    const [rows] = await conn.query<ManutencaoRow[]>(
      `
        SELECT *
          FROM manutencao_maquinas
          ${where}
      ORDER BY COALESCE(data_execucao, proxima_prevista) DESC, id DESC
         LIMIT ? OFFSET ?
      `,
      [...params, limit, offset]
    );

    return { total, pagina, quantidadePorPagina: limit, itens: rows };
  } finally {
    conn.release();
  }
};

export const atualizarStatus = async (id: number, novoStatus: string) => {
  const conn: PoolConnection = await pool.getConnection();
  try {
    const [result] = await conn.query<ResultSetHeader>(
      `UPDATE manutencao_maquinas SET status = ? WHERE id = ?`,
      [novoStatus, id]
    );
    return result.affectedRows > 0;
  } finally {
    conn.release();
  }
};