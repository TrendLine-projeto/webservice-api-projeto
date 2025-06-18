import pool from '../connect/mysql';
import { RowDataPacket } from 'mysql2/promise';

export const buscarTiposPorCategoriaDb = async (categoria: string): Promise<RowDataPacket[]> => {
  const conn = await pool.getConnection();
  try {
    const query = `
      SELECT id, nome FROM tipos_produto WHERE categoria = ? AND ativo = true ORDER BY nome ASC`;
    const [rows] = await conn.query<RowDataPacket[]>(query, [categoria]);
    return rows;
  } finally {
    conn.release();
  }
};