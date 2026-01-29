import pool from '../connect/mysql';
import { PoolConnection, ResultSetHeader } from 'mysql2/promise';
import {
  ConferenciaQualidadeBase,
  ConferenciaQualidadeFiltro,
  ConferenciaQualidadeRow
} from '../types/qualidade/ConferenciaQualidade';

const TABLE = 'conferencias_qualidade';
const SELECT_COLUMNS = `
  id,
  idProdutoProducao,
  identificador,
  dataConferencia,
  status,
  qtdInspecionada,
  qtdAprovada,
  qtdReprovada,
  observacaoGeral,
  requerReinspecao,
  finalizada
`;

export const verificarProdutoProducaoPorId = async (id: number): Promise<boolean> => {
  const conn: PoolConnection = await pool.getConnection();
  try {
    const [rows] = await conn.query('SELECT id FROM produtos_producao WHERE id = ?', [id]);
    return (rows as any[]).length > 0;
  } finally {
    conn.release();
  }
};

export const buscarQuantidadeProdutoProducao = async (id: number): Promise<number | null> => {
  const conn: PoolConnection = await pool.getConnection();
  try {
    const [rows] = await conn.query<any[]>(
      'SELECT quantidadeProduto FROM produtos_producao WHERE id = ? LIMIT 1',
      [id]
    );
    if (!rows?.length) return null;
    const quantidade = Number(rows[0].quantidadeProduto);
    return Number.isFinite(quantidade) ? quantidade : null;
  } finally {
    conn.release();
  }
};

export const verificarConferenciaFinalizadaPorProdutoId = async (idProdutoProducao: number): Promise<boolean> => {
  const conn: PoolConnection = await pool.getConnection();
  try {
    const [rows] = await conn.query(
      `SELECT id FROM ${TABLE} WHERE idProdutoProducao = ? AND finalizada = 1 LIMIT 1`,
      [idProdutoProducao]
    );
    return (rows as any[]).length > 0;
  } finally {
    conn.release();
  }
};

export const verificarIdentificadorExiste = async (identificador: string): Promise<boolean> => {
  const conn: PoolConnection = await pool.getConnection();
  try {
    const [rows] = await conn.query(
      `SELECT id FROM ${TABLE} WHERE identificador = ? LIMIT 1`,
      [identificador]
    );
    return (rows as any[]).length > 0;
  } finally {
    conn.release();
  }
};

export const inserir = async (payload: ConferenciaQualidadeBase): Promise<ResultSetHeader> => {
  const conn: PoolConnection = await pool.getConnection();
  try {
    const [result] = await conn.query<ResultSetHeader>(
      `
      INSERT INTO ${TABLE} (
        idProdutoProducao,
        identificador,
        dataConferencia,
        status,
        qtdInspecionada,
        qtdAprovada,
        qtdReprovada,
        observacaoGeral,
        requerReinspecao,
        finalizada
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        payload.idProdutoProducao,
        payload.identificador ?? null,
        payload.dataConferencia ?? new Date(),
        payload.status ?? null,
        payload.qtdInspecionada ?? 0,
        payload.qtdAprovada ?? 0,
        payload.qtdReprovada ?? 0,
        payload.observacaoGeral ?? null,
        payload.requerReinspecao ?? 0,
        payload.finalizada ?? 0
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
    const [rows] = await conn.query<ConferenciaQualidadeRow[]>(
      `SELECT ${SELECT_COLUMNS} FROM ${TABLE} WHERE id = ?`,
      [id]
    );
    return rows[0] ?? null;
  } finally {
    conn.release();
  }
};

export const buscarPorProdutoIds = async (produtoIds: number[]) => {
  if (!produtoIds.length) return {};

  const placeholders = produtoIds.map(() => '?').join(',');
  const query = `
    SELECT ${SELECT_COLUMNS}
      FROM ${TABLE}
     WHERE idProdutoProducao IN (${placeholders})
    ORDER BY id DESC
  `;

  const conn: PoolConnection = await pool.getConnection();
  try {
    const [rows] = await conn.query<ConferenciaQualidadeRow[]>(query, produtoIds);
    const conferenciasPorProduto: Record<number, ConferenciaQualidadeRow[]> = {};

    rows.forEach((row) => {
      if (!conferenciasPorProduto[row.idProdutoProducao]) {
        conferenciasPorProduto[row.idProdutoProducao] = [];
      }
      conferenciasPorProduto[row.idProdutoProducao].push(row);
    });

    return conferenciasPorProduto;
  } finally {
    conn.release();
  }
};

export const atualizar = async (id: number, payload: ConferenciaQualidadeBase) => {
  const conn = await pool.getConnection();
  try {
    const [result] = await conn.query<ResultSetHeader>(
      `
      UPDATE ${TABLE}
         SET idProdutoProducao = ?,
             identificador = ?,
             dataConferencia = ?,
             status = ?,
             qtdInspecionada = ?,
             qtdAprovada = ?,
             qtdReprovada = ?,
             observacaoGeral = ?,
             requerReinspecao = ?,
             finalizada = ?
       WHERE id = ?
      `,
      [
        payload.idProdutoProducao,
        payload.identificador ?? null,
        payload.dataConferencia ?? null,
        payload.status ?? null,
        payload.qtdInspecionada ?? 0,
        payload.qtdAprovada ?? 0,
        payload.qtdReprovada ?? 0,
        payload.observacaoGeral ?? null,
        payload.requerReinspecao ?? 0,
        payload.finalizada ?? 0,
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

export const listar = async (p: ConferenciaQualidadeFiltro) => {
  const pagina = Math.max(Number(p.pagina ?? 1), 1);
  const limit = Math.max(Number(p.quantidadePorPagina ?? 10), 1);
  const offset = (pagina - 1) * limit;

  const filtros: string[] = [];
  const params: any[] = [];

  if (p.idProdutoProducao !== undefined && p.idProdutoProducao !== null && String(p.idProdutoProducao) !== '') {
    filtros.push('idProdutoProducao = ?');
    params.push(Number(p.idProdutoProducao));
  }

  if (p.identificador) {
    filtros.push('identificador LIKE ?');
    params.push(`%${p.identificador}%`);
  }

  if (p.status) {
    filtros.push('status LIKE ?');
    params.push(`%${p.status}%`);
  }

  if (p.requerReinspecao !== undefined && p.requerReinspecao !== null && String(p.requerReinspecao) !== '') {
    filtros.push('requerReinspecao = ?');
    params.push(Number(p.requerReinspecao));
  }

  if (p.finalizada !== undefined && p.finalizada !== null && String(p.finalizada) !== '') {
    filtros.push('finalizada = ?');
    params.push(Number(p.finalizada));
  }

  if (p.dataConferenciaDe) {
    filtros.push('dataConferencia >= ?');
    params.push(p.dataConferenciaDe);
  }

  if (p.dataConferenciaAte) {
    filtros.push('dataConferencia <= ?');
    params.push(p.dataConferenciaAte);
  }

  const where = filtros.length ? `WHERE ${filtros.join(' AND ')}` : '';

  const conn = await pool.getConnection();
  try {
    const [[{ total }]] = await conn.query<any[]>(
      `SELECT COUNT(*) AS total FROM ${TABLE} ${where}`,
      params
    );

    const [rows] = await conn.query<ConferenciaQualidadeRow[]>(
      `
      SELECT ${SELECT_COLUMNS}
        FROM ${TABLE}
        ${where}
    ORDER BY dataConferencia DESC, id DESC
       LIMIT ? OFFSET ?
      `,
      [...params, limit, offset]
    );

    return { total, pagina, quantidadePorPagina: limit, itens: rows };
  } finally {
    conn.release();
  }
};
