import pool from '../connect/mysql';
import { PoolConnection, ResultSetHeader } from 'mysql2/promise';
import {
  LoteFechamentoBase,
  LoteFechamentoFiltro,
  LoteFechamentoRow
} from '../types/lotes/LoteFechamento';

const TABLE = 'lotes_fechamento';

export const verificarEntradaLotePorId = async (id: number): Promise<boolean> => {
  const conn: PoolConnection = await pool.getConnection();
  try {
    const [rows] = await conn.query('SELECT id FROM entrada_lotes WHERE id = ?', [id]);
    return (rows as any[]).length > 0;
  } finally {
    conn.release();
  }
};

export const buscarClientePorEntradaLoteId = async (idEntradaLote: number): Promise<number | null> => {
  const conn: PoolConnection = await pool.getConnection();
  try {
    const [rows] = await conn.query<any[]>(
      `
      SELECT f.idCliente
        FROM entrada_lotes el
        JOIN filiais f ON f.id = el.idFilial
       WHERE el.id = ?
       LIMIT 1
      `,
      [idEntradaLote]
    );
    return rows?.[0]?.idCliente ?? null;
  } finally {
    conn.release();
  }
};

export const inserir = async (payload: LoteFechamentoBase): Promise<ResultSetHeader> => {
  const conn: PoolConnection = await pool.getConnection();
  try {
    const [result] = await conn.query<ResultSetHeader>(
      `
      INSERT INTO ${TABLE} (
        id_entrada_lote,
        concluido100,
        teveBonus,
        bonusValor,
        pecasConcluidasSucesso,
        acrescimoEntregaPercent,
        fechadoEm
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      [
        payload.id_entrada_lote ?? null,
        payload.concluido100,
        payload.teveBonus ?? null,
        payload.bonusValor ?? null,
        payload.pecasConcluidasSucesso ?? null,
        payload.acrescimoEntregaPercent ?? null,
        payload.fechadoEm ?? new Date()
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
    const [rows] = await conn.query<LoteFechamentoRow[]>(
      `SELECT * FROM ${TABLE} WHERE id = ?`,
      [id]
    );
    return rows[0] ?? null;
  } finally {
    conn.release();
  }
};

export const buscarPorEntradaLoteId = async (idEntradaLote: number) => {
  const conn = await pool.getConnection();
  try {
    const [rows] = await conn.query<LoteFechamentoRow[]>(
      `SELECT * FROM ${TABLE} WHERE id_entrada_lote = ? LIMIT 1`,
      [idEntradaLote]
    );
    return rows[0] ?? null;
  } finally {
    conn.release();
  }
};

export const buscarPorEntradaLoteIds = async (ids: number[]) => {
  if (!ids.length) return {};

  const conn = await pool.getConnection();
  try {
    const placeholders = ids.map(() => '?').join(', ');
    const [rows] = await conn.query<LoteFechamentoRow[]>(
      `SELECT * FROM ${TABLE} WHERE id_entrada_lote IN (${placeholders})`,
      ids
    );

    return rows.reduce<Record<number, LoteFechamentoRow>>((acc, row) => {
      if (row.id_entrada_lote !== null && row.id_entrada_lote !== undefined) {
        acc[row.id_entrada_lote] = row;
      }
      return acc;
    }, {});
  } finally {
    conn.release();
  }
};

export const atualizar = async (id: number, payload: LoteFechamentoBase) => {
  const conn = await pool.getConnection();
  try {
    const [result] = await conn.query<ResultSetHeader>(
      `
      UPDATE ${TABLE}
         SET id_entrada_lote = ?,
             concluido100 = ?,
             teveBonus = ?,
             bonusValor = ?,
             pecasConcluidasSucesso = ?,
             acrescimoEntregaPercent = ?,
             fechadoEm = ?
       WHERE id = ?
      `,
      [
        payload.id_entrada_lote ?? null,
        payload.concluido100,
        payload.teveBonus ?? null,
        payload.bonusValor ?? null,
        payload.pecasConcluidasSucesso ?? null,
        payload.acrescimoEntregaPercent ?? null,
        payload.fechadoEm ?? null,
        id
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
      `DELETE FROM ${TABLE} WHERE id = ?`,
      [id]
    );
    return result.affectedRows > 0;
  } finally {
    conn.release();
  }
};

export const listar = async (p: LoteFechamentoFiltro) => {
  const pagina = Math.max(Number(p.pagina ?? 1), 1);
  const limit = Math.max(Number(p.quantidadePorPagina ?? 10), 1);
  const offset = (pagina - 1) * limit;

  const filtros: string[] = [];
  const params: any[] = [];

  if (p.id_entrada_lote !== undefined && p.id_entrada_lote !== null && p.id_entrada_lote !== '') {
    filtros.push('id_entrada_lote = ?');
    params.push(Number(p.id_entrada_lote));
  }

  if (p.concluido100 !== undefined && p.concluido100 !== null && p.concluido100 !== '') {
    filtros.push('concluido100 = ?');
    params.push(Number(p.concluido100));
  }

  if (p.teveBonus !== undefined && p.teveBonus !== null && p.teveBonus !== '') {
    filtros.push('teveBonus = ?');
    params.push(Number(p.teveBonus));
  }

  if (p.fechadoEmDe) {
    filtros.push('fechadoEm >= ?');
    params.push(p.fechadoEmDe);
  }

  if (p.fechadoEmAte) {
    filtros.push('fechadoEm <= ?');
    params.push(p.fechadoEmAte);
  }

  const where = filtros.length ? `WHERE ${filtros.join(' AND ')}` : '';

  const conn = await pool.getConnection();
  try {
    const [[{ total }]] = await conn.query<any[]>(
      `SELECT COUNT(*) AS total FROM ${TABLE} ${where}`,
      params
    );

    const [rows] = await conn.query<LoteFechamentoRow[]>(
      `
      SELECT *
        FROM ${TABLE}
        ${where}
    ORDER BY fechadoEm DESC, id DESC
       LIMIT ? OFFSET ?
      `,
      [...params, limit, offset]
    );

    return {
      total,
      pagina,
      quantidadePorPagina: limit,
      itens: rows
    };
  } finally {
    conn.release();
  }
};
