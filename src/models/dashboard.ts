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

const buildFiltroLotes = (
  params: any[],
  dataEntradaDe?: string | null,
  dataEntradaAte?: string | null,
  idFilial?: number | null,
  idFornecedor?: number | null
) => {
  let where = '';

  if (dataEntradaDe) {
    where += ' AND el.dataEntrada >= ?';
    params.push(dataEntradaDe);
  }
  if (dataEntradaAte) {
    where += ' AND el.dataEntrada <= ?';
    params.push(dataEntradaAte);
  }
  if (idFilial) {
    where += ' AND el.idFilial = ?';
    params.push(idFilial);
  }
  if (idFornecedor) {
    where += ' AND el.idFornecedor_producao = ?';
    params.push(idFornecedor);
  }

  return where;
};

export const buscarLotesPorFilial = async (
  idCliente: number,
  dataEntradaDe?: string | null,
  dataEntradaAte?: string | null,
  idFilial?: number | null,
  idFornecedor?: number | null
) => {
  const conn: PoolConnection = await pool.getConnection();
  try {
    const params: any[] = [idCliente];
    const filtros = buildFiltroLotes(params, dataEntradaDe, dataEntradaAte, idFilial, idFornecedor);

    const [rows] = await conn.query<RowDataPacket[]>(
      `
        SELECT
          el.idFilial,
          f.nomeFilial,
          COUNT(*) AS totalLotes,
          SUM(CASE WHEN el.loteFinalizado = 1 THEN 1 ELSE 0 END) AS lotesFinalizados,
          SUM(CASE WHEN el.loteIniciado = 1 AND (el.loteFinalizado = 0 OR el.loteFinalizado IS NULL) THEN 1 ELSE 0 END) AS lotesEmProducao,
          SUM(CASE WHEN (el.loteIniciado = 0 OR el.loteIniciado IS NULL) THEN 1 ELSE 0 END) AS lotesNaoIniciados,
          COALESCE(SUM(CAST(REPLACE(el.valorEstimado, ',', '.') AS DECIMAL(12,2))), 0) AS valorTotal
        FROM entrada_lotes el
        JOIN filiais f ON f.id = el.idFilial
        WHERE f.idCliente = ?
        ${filtros}
        GROUP BY el.idFilial, f.nomeFilial
        ORDER BY totalLotes DESC
      `,
      params
    );

    return rows;
  } finally {
    conn.release();
  }
};

export const buscarLotesPorFornecedor = async (
  idCliente: number,
  dataEntradaDe?: string | null,
  dataEntradaAte?: string | null,
  idFilial?: number | null,
  idFornecedor?: number | null
) => {
  const conn: PoolConnection = await pool.getConnection();
  try {
    const params: any[] = [idCliente];
    const filtros = buildFiltroLotes(params, dataEntradaDe, dataEntradaAte, idFilial, idFornecedor);

    const [rows] = await conn.query<RowDataPacket[]>(
      `
        SELECT
          el.idFornecedor_producao AS idFornecedor,
          COALESCE(fp.nomeFantasia, fp.razaoSocial) AS nomeFornecedor,
          fp.cnpj AS cnpjFornecedor,
          COUNT(*) AS totalLotes,
          SUM(CASE WHEN el.loteFinalizado = 1 THEN 1 ELSE 0 END) AS lotesFinalizados,
          SUM(CASE WHEN el.loteIniciado = 1 AND (el.loteFinalizado = 0 OR el.loteFinalizado IS NULL) THEN 1 ELSE 0 END) AS lotesEmProducao,
          SUM(CASE WHEN (el.loteIniciado = 0 OR el.loteIniciado IS NULL) THEN 1 ELSE 0 END) AS lotesNaoIniciados,
          COALESCE(SUM(CAST(REPLACE(el.valorEstimado, ',', '.') AS DECIMAL(12,2))), 0) AS valorTotal
        FROM entrada_lotes el
        JOIN filiais f ON f.id = el.idFilial
        LEFT JOIN fornecedor_producao fp ON fp.id = el.idFornecedor_producao
        WHERE f.idCliente = ?
        ${filtros}
        GROUP BY el.idFornecedor_producao, fp.nomeFantasia, fp.razaoSocial, fp.cnpj
        ORDER BY totalLotes DESC
      `,
      params
    );

    return rows;
  } finally {
    conn.release();
  }
};

export const buscarPrevisaoSaida = async (
  idCliente: number,
  dataPrevistaDe: string,
  dataPrevistaAte: string,
  limite: number,
  idFilial?: number | null,
  idFornecedor?: number | null
) => {
  const conn: PoolConnection = await pool.getConnection();
  try {
    const params: any[] = [idCliente, dataPrevistaDe, dataPrevistaAte];
    let filtros = '';
    if (idFilial) {
      filtros += ' AND el.idFilial = ?';
      params.push(idFilial);
    }
    if (idFornecedor) {
      filtros += ' AND el.idFornecedor_producao = ?';
      params.push(idFornecedor);
    }

    params.push(limite);

    const [rows] = await conn.query<RowDataPacket[]>(
      `
        SELECT
          el.id,
          el.numeroIdentificador,
          el.dataPrevistaSaida,
          el.loteIniciado,
          el.loteFinalizado,
          el.idFilial,
          f.nomeFilial,
          el.idFornecedor_producao AS idFornecedor,
          COALESCE(fp.nomeFantasia, fp.razaoSocial) AS nomeFornecedor
        FROM entrada_lotes el
        JOIN filiais f ON f.id = el.idFilial
        LEFT JOIN fornecedor_producao fp ON fp.id = el.idFornecedor_producao
        WHERE f.idCliente = ?
          AND el.dataPrevistaSaida IS NOT NULL
          AND el.dataPrevistaSaida >= ?
          AND el.dataPrevistaSaida <= ?
          ${filtros}
        ORDER BY el.dataPrevistaSaida ASC
        LIMIT ?
      `,
      params
    );

    return rows;
  } finally {
    conn.release();
  }
};

export const buscarAgingLotesAberto = async (
  idCliente: number,
  dataEntradaDe?: string | null,
  dataEntradaAte?: string | null,
  idFilial?: number | null,
  idFornecedor?: number | null
) => {
  const conn: PoolConnection = await pool.getConnection();
  try {
    const params: any[] = [idCliente];
    let filtros = '';

    if (dataEntradaDe) {
      filtros += ' AND el.dataEntrada >= ?';
      params.push(dataEntradaDe);
    }
    if (dataEntradaAte) {
      filtros += ' AND el.dataEntrada <= ?';
      params.push(dataEntradaAte);
    }
    if (idFilial) {
      filtros += ' AND el.idFilial = ?';
      params.push(idFilial);
    }
    if (idFornecedor) {
      filtros += ' AND el.idFornecedor_producao = ?';
      params.push(idFornecedor);
    }

    const [rows] = await conn.query<RowDataPacket[]>(
      `
        SELECT
          COUNT(*) AS totalAberto,
          SUM(CASE WHEN idadeDias <= 7 THEN 1 ELSE 0 END) AS ate7,
          SUM(CASE WHEN idadeDias BETWEEN 8 AND 15 THEN 1 ELSE 0 END) AS de8a15,
          SUM(CASE WHEN idadeDias BETWEEN 16 AND 30 THEN 1 ELSE 0 END) AS de16a30,
          SUM(CASE WHEN idadeDias > 30 THEN 1 ELSE 0 END) AS acima30
        FROM (
          SELECT
            TIMESTAMPDIFF(DAY, el.dataEntrada, NOW()) AS idadeDias
          FROM entrada_lotes el
          JOIN filiais f ON f.id = el.idFilial
          WHERE f.idCliente = ?
            AND (el.loteFinalizado = 0 OR el.loteFinalizado IS NULL)
            ${filtros}
        ) base
      `,
      params
    );

    return rows[0] || {};
  } finally {
    conn.release();
  }
};

export const buscarLotesRiscoAtraso = async (
  idCliente: number,
  dataPrevistaDe?: string | null,
  dataPrevistaAte?: string | null,
  diasRisco?: number | null,
  limite?: number | null,
  idFilial?: number | null,
  idFornecedor?: number | null
) => {
  const conn: PoolConnection = await pool.getConnection();
  try {
    const params: any[] = [idCliente];
    let filtros = '';

    if (dataPrevistaDe) {
      filtros += ' AND el.dataPrevistaSaida >= ?';
      params.push(dataPrevistaDe);
    }
    if (dataPrevistaAte) {
      filtros += ' AND el.dataPrevistaSaida <= ?';
      params.push(dataPrevistaAte);
    }
    if (idFilial) {
      filtros += ' AND el.idFilial = ?';
      params.push(idFilial);
    }
    if (idFornecedor) {
      filtros += ' AND el.idFornecedor_producao = ?';
      params.push(idFornecedor);
    }

    const dias = Number.isFinite(Number(diasRisco)) ? Number(diasRisco) : 2;
    params.push(dias);

    const limiteFinal = Number.isFinite(Number(limite)) ? Number(limite) : 20;
    params.push(limiteFinal);

    const [rows] = await conn.query<RowDataPacket[]>(
      `
        SELECT
          el.id,
          el.numeroIdentificador,
          el.dataPrevistaSaida,
          el.loteIniciado,
          el.loteFinalizado,
          el.idFilial,
          f.nomeFilial,
          el.idFornecedor_producao AS idFornecedor,
          COALESCE(fp.nomeFantasia, fp.razaoSocial) AS nomeFornecedor,
          DATEDIFF(el.dataPrevistaSaida, NOW()) AS diasParaPrazo
        FROM entrada_lotes el
        JOIN filiais f ON f.id = el.idFilial
        LEFT JOIN fornecedor_producao fp ON fp.id = el.idFornecedor_producao
        WHERE f.idCliente = ?
          AND (el.loteFinalizado = 0 OR el.loteFinalizado IS NULL)
          AND el.dataPrevistaSaida IS NOT NULL
          ${filtros}
          AND DATEDIFF(el.dataPrevistaSaida, NOW()) <= ?
        ORDER BY el.dataPrevistaSaida ASC
        LIMIT ?
      `,
      params
    );

    return rows;
  } finally {
    conn.release();
  }
};
