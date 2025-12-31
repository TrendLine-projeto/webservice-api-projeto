import pool from '../connect/mysql';
import { PoolConnection, ResultSetHeader } from 'mysql2/promise';
import { OrdemServicoBase, OrdemServicoRow, PaginacaoParams } from '../types/ordensServico/ordensServico';

const TABLE = 'ordens_servico';

export const inserir = async (o: OrdemServicoBase) => {
  const conn: PoolConnection = await pool.getConnection();
  try {
    const [result] = await conn.query<ResultSetHeader>(
      `
      INSERT INTO ${TABLE} (
        descricao, descricaoAtivo, numeroOrdem, dataAbertura,
        ordemManual, finalizado, dataFinalizado, descricaoFinalizado, idCliente
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        o.descricao,
        o.descricaoAtivo ?? null,
        o.numeroOrdem,
        o.dataAbertura ?? null,
        o.ordemManual ?? 0,
        o.finalizado ?? 0,
        o.dataFinalizado ?? null,
        o.descricaoFinalizado ?? null,
        o.idCliente
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
    const [rows] = await conn.query<OrdemServicoRow[]>(
      `SELECT * FROM ${TABLE} WHERE id = ?`,
      [id]
    );
    return rows[0] ?? null;
  } finally {
    conn.release();
  }
};

export const buscarPorNumero = async (numeroOrdem: string) => {
  const conn = await pool.getConnection();
  try {
    const [rows] = await conn.query<OrdemServicoRow[]>(
      `SELECT * FROM ${TABLE} WHERE numeroOrdem = ? LIMIT 1`,
      [numeroOrdem]
    );
    return rows[0] ?? null;
  } finally {
    conn.release();
  }
};

export const atualizar = async (id: number, o: OrdemServicoBase) => {
  const conn = await pool.getConnection();
  try {
    const [result] = await conn.query<ResultSetHeader>(
      `
      UPDATE ${TABLE}
         SET descricao = ?, descricaoAtivo = ?, numeroOrdem = ?, dataAbertura = ?,
             ordemManual = ?, finalizado = ?, dataFinalizado = ?, descricaoFinalizado = ?, idCliente = ?
       WHERE id = ?
      `,
      [
        o.descricao,
        o.descricaoAtivo ?? null,
        o.numeroOrdem,
        o.dataAbertura ?? null,
        o.ordemManual ?? 0,
        o.finalizado ?? 0,
        o.dataFinalizado ?? null,
        o.descricaoFinalizado ?? null,
        o.idCliente,
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

export const listar = async (p: PaginacaoParams) => {
  const pagina = Math.max(Number(p.pagina ?? 1), 1);
  const limit = Math.max(Number(p.quantidadePorPagina ?? 10), 1);
  const offset = (pagina - 1) * limit;

  const filtros: string[] = [];
  const params: any[] = [];

  if (p.idCliente) { filtros.push(`idCliente = ?`); params.push(Number(p.idCliente)); }
  if (p.finalizado !== undefined && p.finalizado !== null && String(p.finalizado) !== '') {
    filtros.push(`finalizado = ?`); params.push(Number(p.finalizado));
  }
  if (p.ordemManual !== undefined && p.ordemManual !== null && String(p.ordemManual) !== '') {
    filtros.push(`ordemManual = ?`); params.push(Number(p.ordemManual));
  }
  if (p.numeroOrdem) { filtros.push(`numeroOrdem LIKE ?`); params.push(`%${p.numeroOrdem}%`); }
  if (p.busca) {
    filtros.push(`(descricao LIKE ? OR descricaoAtivo LIKE ?)`); 
    const like = `%${p.busca}%`;
    params.push(like, like);
  }
  if (p.dataAberturaDe) { filtros.push(`dataAbertura >= ?`); params.push(p.dataAberturaDe); }
  if (p.dataAberturaAte) { filtros.push(`dataAbertura <= ?`); params.push(p.dataAberturaAte); }

  const where = filtros.length ? `WHERE ${filtros.join(' AND ')}` : '';

  const conn = await pool.getConnection();
  try {
    const [[{ total }]] = await conn.query<any[]>(
      `SELECT COUNT(*) AS total FROM ${TABLE} ${where}`,
      params
    );

    const [rows] = await conn.query<OrdemServicoRow[]>(
      `
        SELECT *
          FROM ${TABLE}
          ${where}
      ORDER BY COALESCE(dataFinalizado, dataAbertura) DESC, id DESC
         LIMIT ? OFFSET ?
      `,
      [...params, limit, offset]
    );

    return { total, pagina, quantidadePorPagina: limit, itens: rows };
  } finally {
    conn.release();
  }
};

export const finalizar = async (
  id: number,
  finalizado: number,
  descricaoFinalizado?: string | null,
  dataFinalizado?: string | Date | null
) => {
  const conn: PoolConnection = await pool.getConnection();
  try {
    const [result] = await conn.query<ResultSetHeader>(
      `
      UPDATE ${TABLE}
         SET finalizado = ?, descricaoFinalizado = ?, dataFinalizado = ?
       WHERE id = ?
      `,
      [finalizado, descricaoFinalizado ?? null, dataFinalizado ?? new Date(), id]
    );
    return result.affectedRows > 0;
  } finally {
    conn.release();
  }
};
