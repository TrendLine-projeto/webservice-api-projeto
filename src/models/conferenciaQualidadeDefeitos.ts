import pool from '../connect/mysql';
import { PoolConnection, ResultSetHeader } from 'mysql2/promise';
import {
  ConferenciaQualidadeDefeitoBase,
  ConferenciaQualidadeDefeitoFiltro,
  ConferenciaQualidadeDefeitoRow
} from '../types/qualidade/ConferenciaQualidadeDefeito';

const TABLE = 'conferencia_qualidade_defeitos';

export const verificarConferenciaQualidadePorId = async (id: number): Promise<boolean> => {
  const conn: PoolConnection = await pool.getConnection();
  try {
    const [rows] = await conn.query('SELECT id FROM conferencias_qualidade WHERE id = ?', [id]);
    return (rows as any[]).length > 0;
  } finally {
    conn.release();
  }
};

export const inserir = async (payload: ConferenciaQualidadeDefeitoBase): Promise<ResultSetHeader> => {
  const conn: PoolConnection = await pool.getConnection();
  try {
    const [result] = await conn.query<ResultSetHeader>(
      `
      INSERT INTO ${TABLE} (
        id,
        idConferenciaQualidade,
        tipoDefeito,
        quantidade,
        observacao
      ) VALUES (?, ?, ?, ?, ?)
      `,
      [
        payload.id,
        payload.idConferenciaQualidade ?? null,
        payload.tipoDefeito ?? null,
        payload.quantidade ?? null,
        payload.observacao ?? null
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
    const [rows] = await conn.query<ConferenciaQualidadeDefeitoRow[]>(
      `SELECT * FROM ${TABLE} WHERE id = ?`,
      [id]
    );
    return rows[0] ?? null;
  } finally {
    conn.release();
  }
};

export const buscarPorConferenciaIds = async (conferenciaIds: number[]) => {
  if (!conferenciaIds.length) return {};

  const placeholders = conferenciaIds.map(() => '?').join(',');
  const query = `
    SELECT *
      FROM ${TABLE}
     WHERE idConferenciaQualidade IN (${placeholders})
    ORDER BY id DESC
  `;

  const conn = await pool.getConnection();
  try {
    const [rows] = await conn.query<ConferenciaQualidadeDefeitoRow[]>(query, conferenciaIds);
    const defeitosPorConferencia: Record<number, ConferenciaQualidadeDefeitoRow[]> = {};

    rows.forEach((row) => {
      const conferenciaId = row.idConferenciaQualidade;
      if (!conferenciaId) return;
      if (!defeitosPorConferencia[conferenciaId]) {
        defeitosPorConferencia[conferenciaId] = [];
      }
      defeitosPorConferencia[conferenciaId].push(row);
    });

    return defeitosPorConferencia;
  } finally {
    conn.release();
  }
};

export const atualizar = async (id: number, payload: ConferenciaQualidadeDefeitoBase) => {
  const conn = await pool.getConnection();
  try {
    const [result] = await conn.query<ResultSetHeader>(
      `
      UPDATE ${TABLE}
         SET idConferenciaQualidade = ?,
             tipoDefeito = ?,
             quantidade = ?,
             observacao = ?
       WHERE id = ?
      `,
      [
        payload.idConferenciaQualidade ?? null,
        payload.tipoDefeito ?? null,
        payload.quantidade ?? null,
        payload.observacao ?? null,
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

export const removerPorConferenciaId = async (idConferenciaQualidade: number) => {
  const conn = await pool.getConnection();
  try {
    const [result] = await conn.query<ResultSetHeader>(
      `DELETE FROM ${TABLE} WHERE idConferenciaQualidade = ?`,
      [idConferenciaQualidade]
    );
    return result.affectedRows;
  } finally {
    conn.release();
  }
};

export const listar = async (p: ConferenciaQualidadeDefeitoFiltro) => {
  const pagina = Math.max(Number(p.pagina ?? 1), 1);
  const limit = Math.max(Number(p.quantidadePorPagina ?? 10), 1);
  const offset = (pagina - 1) * limit;

  const filtros: string[] = [];
  const params: any[] = [];

  if (p.idConferenciaQualidade !== undefined && p.idConferenciaQualidade !== null && String(p.idConferenciaQualidade) !== '') {
    filtros.push('idConferenciaQualidade = ?');
    params.push(Number(p.idConferenciaQualidade));
  }

  if (p.tipoDefeito) {
    filtros.push('tipoDefeito LIKE ?');
    params.push(`%${p.tipoDefeito}%`);
  }

  if (p.quantidade !== undefined && p.quantidade !== null && String(p.quantidade) !== '') {
    filtros.push('quantidade = ?');
    params.push(Number(p.quantidade));
  }

  if (p.observacao) {
    filtros.push('observacao LIKE ?');
    params.push(`%${p.observacao}%`);
  }

  const where = filtros.length ? `WHERE ${filtros.join(' AND ')}` : '';

  const conn = await pool.getConnection();
  try {
    const [[{ total }]] = await conn.query<any[]>(
      `SELECT COUNT(*) AS total FROM ${TABLE} ${where}`,
      params
    );

    const [rows] = await conn.query<ConferenciaQualidadeDefeitoRow[]>(
      `
      SELECT *
        FROM ${TABLE}
        ${where}
    ORDER BY id DESC
       LIMIT ? OFFSET ?
      `,
      [...params, limit, offset]
    );

    return { total, pagina, quantidadePorPagina: limit, itens: rows };
  } finally {
    conn.release();
  }
};
