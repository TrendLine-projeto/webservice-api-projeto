import pool from '../connect/mysql';
import { PoolConnection, ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { NotaFiscal } from '../types/notasFiscais/notaFiscal';

export const inserirNotaFiscal = async (
  nota: NotaFiscal,
  lote_id: number,
  integracao_gmail_xml_id?: number | null
): Promise<void> => {
  const conn: PoolConnection = await pool.getConnection();

  try {
    const query = `
      INSERT INTO notas_fiscais (
        chaveAcesso, numeroNota, serie, dataEmissao,
        valorProdutos, valorFrete, valorICMS, valorIPI,
        transportadora, qtdVolumes, pesoBruto, lote_id,
        integracao_gmail_xml_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
      lote_id,
      integracao_gmail_xml_id ?? null
    ];

    await conn.query<ResultSetHeader>(query, values);
  } finally {
    conn.release();
  }
};

export const buscarPorId = async (id: number) => {
  const conn: PoolConnection = await pool.getConnection();
  try {
    const query = `
      SELECT *
        FROM notas_fiscais
       WHERE id = ?
       LIMIT 1
    `;
    const [rows] = await conn.query<RowDataPacket[]>(query, [id]);
    return rows[0] ?? null;
  } finally {
    conn.release();
  }
};

export const buscarNotasPorLoteIds = async (loteIds: number[]) => {
  if (!loteIds.length) return {};

  const placeholders = loteIds.map(() => '?').join(',');

  const query = `
    SELECT * FROM notas_fiscais
    WHERE lote_id IN (${placeholders})
  `;

  const conn: PoolConnection = await pool.getConnection();
  try {
    const [result] = await conn.query<RowDataPacket[]>(query, loteIds);
    const notas = result;

    const notasPorLote: Record<number, any[]> = {};
    for (const nf of notas) {
      if (!notasPorLote[nf.lote_id]) {
        notasPorLote[nf.lote_id] = [];
      }
      notasPorLote[nf.lote_id].push(nf);
    }

    return notasPorLote;
  } finally {
    conn.release();
  }
};
