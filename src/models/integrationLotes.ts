import pool from '../connect/mysql';
import { PoolConnection, RowDataPacket } from 'mysql2/promise';

const normalizeCnpj = (cnpj: string) => cnpj.replace(/\D/g, '');

export const buscarClientePorCnpj = async (cnpj: string) => {
  const conn: PoolConnection = await pool.getConnection();
  try {
    const cnpjLimpo = normalizeCnpj(cnpj);
    const query = `
      SELECT id, cnpj
        FROM clientes
       WHERE REPLACE(REPLACE(REPLACE(cnpj, '.', ''), '-', ''), '/', '') = ?
       LIMIT 1
    `;
    const [rows] = await conn.query<RowDataPacket[]>(query, [cnpjLimpo]);
    return rows[0] ?? null;
  } finally {
    conn.release();
  }
};

export const buscarFilialPorClienteId = async (clienteId: number) => {
  const conn: PoolConnection = await pool.getConnection();
  try {
    const query = `
      SELECT id
        FROM filiais
       WHERE idCliente = ?
       ORDER BY id ASC
       LIMIT 1
    `;
    const [rows] = await conn.query<RowDataPacket[]>(query, [clienteId]);
    return rows[0] ?? null;
  } finally {
    conn.release();
  }
};

export const buscarFornecedorPorCnpj = async (clienteId: number, cnpj: string) => {
  const conn: PoolConnection = await pool.getConnection();
  try {
    const cnpjLimpo = normalizeCnpj(cnpj);
    const query = `
      SELECT id, cnpj
        FROM fornecedor_producao
       WHERE cliente_id = ?
         AND REPLACE(REPLACE(REPLACE(cnpj, '.', ''), '-', ''), '/', '') = ?
       LIMIT 1
    `;
    const [rows] = await conn.query<RowDataPacket[]>(query, [clienteId, cnpjLimpo]);
    return rows[0] ?? null;
  } finally {
    conn.release();
  }
};
