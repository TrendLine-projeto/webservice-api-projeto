import pool from '../connect/mysql';
import { PoolConnection, ResultSetHeader, RowDataPacket } from 'mysql2/promise';

const TABLE = 'anexos';
const COL_ID = 'id';
const COL_FK = 'idProduto';
const COL_URL = 'url';

export type AnexoRow = {
  id: number;
  idProduto: number;
  url: string;
};

export const inserirAnexoProduto = async (idProduto: number, url: string) => {
  const conn: PoolConnection = await pool.getConnection();
  try {
    const query = `
      INSERT INTO ${TABLE} (${COL_FK}, ${COL_URL})
      VALUES (?, ?)
    `;
    const [result] = await conn.query<ResultSetHeader>(query, [idProduto, url]);
    return result.insertId;
  } finally {
    conn.release();
  }
};

export const buscarAnexosPorProdutoId = async (idProduto: number): Promise<AnexoRow[]> => {
  const conn: PoolConnection = await pool.getConnection();
  try {
    const query = `
      SELECT ${COL_ID} AS id, ${COL_FK} AS idProduto, ${COL_URL} AS url
        FROM ${TABLE}
       WHERE ${COL_FK} = ?
       ORDER BY ${COL_ID} DESC
    `;
    const [rows] = await conn.query<RowDataPacket[]>(query, [idProduto]);
    return rows as AnexoRow[];
  } finally {
    conn.release();
  }
};

export const buscarAnexosPorProdutoIds = async (ids: number[]) => {
  if (!ids.length) return {} as Record<number, AnexoRow[]>;

  const placeholders = ids.map(() => '?').join(',');
  const conn: PoolConnection = await pool.getConnection();
  try {
    const query = `
      SELECT ${COL_ID} AS id, ${COL_FK} AS idProduto, ${COL_URL} AS url
        FROM ${TABLE}
       WHERE ${COL_FK} IN (${placeholders})
       ORDER BY ${COL_ID} DESC
    `;
    const [rows] = await conn.query<RowDataPacket[]>(query, ids);
    const anexos = rows as AnexoRow[];
    const map: Record<number, AnexoRow[]> = {};

    for (const anexo of anexos) {
      const produtoId = Number(anexo.idProduto);
      if (!map[produtoId]) {
        map[produtoId] = [];
      }
      map[produtoId].push(anexo);
    }

    return map;
  } finally {
    conn.release();
  }
};
