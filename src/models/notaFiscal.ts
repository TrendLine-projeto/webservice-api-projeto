import pool from '../connect/mysql';
import { PoolConnection, ResultSetHeader } from 'mysql2/promise';
import { NotaFiscal } from '../types/notasFiscais/notaFiscal';

export const inserirNotaFiscal = async (
  nota: NotaFiscal,
  lote_id: number
): Promise<void> => {
  const conn: PoolConnection = await pool.getConnection();

  try {
    const query = `
      INSERT INTO notas_fiscais (
        chaveAcesso, numeroNota, serie, dataEmissao,
        valorProdutos, valorFrete, valorICMS, valorIPI,
        transportadora, qtdVolumes, pesoBruto, lote_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      nota.chaveAcesso,
      nota.numeroNota,
      nota.serie,
      nota.dataEmissao,
      nota.valorProdutos,
      nota.valorFrete,
      nota.valorICMS,
      nota.valorIPI,
      nota.transportadora,
      nota.qtdVolumes,
      nota.pesoBruto,
      lote_id
    ];

    await conn.query<ResultSetHeader>(query, values);
  } finally {
    conn.release();
  }
};