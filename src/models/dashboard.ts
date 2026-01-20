import pool from '../connect/mysql';
import { PoolConnection, RowDataPacket } from 'mysql2/promise';

export const buscarResumoPorFornecedor = async (
  idFornecedor: number,
  dataEntradaDe?: string | null,
  dataEntradaAte?: string | null
) => {
  const conn: PoolConnection = await pool.getConnection();

  try {
    let where = 'WHERE idFornecedor_producao = ?';
    const params: any[] = [idFornecedor];

    if (dataEntradaDe) {
      where += ' AND dataEntrada >= ?';
      params.push(dataEntradaDe);
    }

    if (dataEntradaAte) {
      where += ' AND dataEntrada <= ?';
      params.push(dataEntradaAte);
    }

    const [rows] = await conn.query<RowDataPacket[]>(
      `
        SELECT
          COUNT(*) AS totalLotes,
          SUM(CASE WHEN loteIniciado = 1 THEN 1 ELSE 0 END) AS lotesIniciados,
          SUM(CASE WHEN (loteIniciado = 0 OR loteIniciado IS NULL) THEN 1 ELSE 0 END) AS lotesNaoIniciados,
          SUM(CASE WHEN loteFinalizado = 1 THEN 1 ELSE 0 END) AS lotesFinalizados,
          SUM(CASE WHEN loteIniciado = 1 AND (loteFinalizado = 0 OR loteFinalizado IS NULL) THEN 1 ELSE 0 END) AS lotesEmProducao,
          COALESCE(SUM(CAST(REPLACE(valorEstimado, ',', '.') AS DECIMAL(12,2))), 0) AS valorTotal,
          COALESCE(SUM(
            CASE
              WHEN CAST(COALESCE(loteFinalizado, 0) AS UNSIGNED) = 1
                THEN CAST(REPLACE(valorEstimado, ',', '.') AS DECIMAL(12,2))
              ELSE 0
            END
          ), 0) AS valorRecebido,
          COALESCE(SUM(
            CASE
              WHEN CAST(COALESCE(loteIniciado, 0) AS UNSIGNED) = 1
               AND CAST(COALESCE(loteFinalizado, 0) AS UNSIGNED) = 0
                THEN CAST(REPLACE(valorEstimado, ',', '.') AS DECIMAL(12,2))
              ELSE 0
            END
          ), 0) AS valorEmProducao,
          COALESCE(SUM(
            CASE
              WHEN CAST(COALESCE(loteIniciado, 0) AS UNSIGNED) = 0
                THEN CAST(REPLACE(valorEstimado, ',', '.') AS DECIMAL(12,2))
              ELSE 0
            END
          ), 0) AS valorAReceber
        FROM entrada_lotes
        ${where}
      `,
      params
    );

    return rows[0] || {};
  } finally {
    conn.release();
  }
};

export const buscarSerieMensalPorFornecedor = async (
  idFornecedor: number,
  meses?: number | null,
  dataEntradaDe?: string | null,
  dataEntradaAte?: string | null
) => {
  const conn: PoolConnection = await pool.getConnection();

  try {
    let where = 'WHERE idFornecedor_producao = ?';
    const params: any[] = [idFornecedor];

    if (dataEntradaDe) {
      where += ' AND dataEntrada >= ?';
      params.push(dataEntradaDe);
    }

    if (dataEntradaAte) {
      where += ' AND dataEntrada <= ?';
      params.push(dataEntradaAte);
    }

    if (meses && meses > 0) {
      where += ' AND dataEntrada >= DATE_SUB(CURDATE(), INTERVAL ? MONTH)';
      params.push(meses);
    }

    const [rows] = await conn.query<RowDataPacket[]>(
      `
        SELECT
          DATE_FORMAT(dataEntrada, '%Y-%m') AS mes,
          COUNT(*) AS totalLotes,
          COALESCE(SUM(CAST(REPLACE(valorEstimado, ',', '.') AS DECIMAL(12,2))), 0) AS valorTotal,
          COALESCE(SUM(
            CASE
              WHEN CAST(COALESCE(loteFinalizado, 0) AS UNSIGNED) = 1
                THEN CAST(REPLACE(valorEstimado, ',', '.') AS DECIMAL(12,2))
              ELSE 0
            END
          ), 0) AS valorRecebido,
          COALESCE(SUM(
            CASE
              WHEN CAST(COALESCE(loteIniciado, 0) AS UNSIGNED) = 1
               AND CAST(COALESCE(loteFinalizado, 0) AS UNSIGNED) = 0
                THEN CAST(REPLACE(valorEstimado, ',', '.') AS DECIMAL(12,2))
              ELSE 0
            END
          ), 0) AS valorEmProducao,
          COALESCE(SUM(
            CASE
              WHEN CAST(COALESCE(loteIniciado, 0) AS UNSIGNED) = 0
                THEN CAST(REPLACE(valorEstimado, ',', '.') AS DECIMAL(12,2))
              ELSE 0
            END
          ), 0) AS valorAReceber
        FROM entrada_lotes
        ${where}
        GROUP BY mes
        ORDER BY mes ASC
      `,
      params
    );

    return rows;
  } finally {
    conn.release();
  }
};
