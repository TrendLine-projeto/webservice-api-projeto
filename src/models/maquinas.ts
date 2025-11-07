// src/models/maquinasModel.ts
import pool from '../connect/mysql';
import { PoolConnection, ResultSetHeader } from 'mysql2/promise';
import { MaquinaBase, MaquinaRow, PaginacaoParams, Maquina, DatasManutencao  } from '../types/maquinas/maquinas';

const colsInsert = `
  codigo_interno, nome, descricao, tipo, setor, fabricante, modelo, numero_serie,
  ano_fabricacao, capacidade_producao, tensao, potencia_kw, horimetro_atual, vida_util_estimada,
  status, data_aquisicao, garantia_ate, localizacao, proxima_manutencao, ultima_manutencao,
  mtbf, mttr, valor_aquisicao, custo_acumulado_manut, observacoes, criado_em
`;

export const inserir = async (m: MaquinaBase) => {
  const conn: PoolConnection = await pool.getConnection();
  try {
    const [result] = await conn.query<ResultSetHeader>(
      `
      INSERT INTO maquinas (${colsInsert})
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
      `,
      [
        m.codigo_interno, m.nome, m.descricao ?? null, m.tipo ?? null, m.setor ?? null,
        m.fabricante ?? null, m.modelo ?? null, m.numero_serie, m.ano_fabricacao ?? null,
        m.capacidade_producao ?? null, m.tensao ?? null, m.potencia_kw ?? null, m.horimetro_atual ?? null,
        m.vida_util_estimada ?? null, m.status ?? null, m.data_aquisicao ?? null, m.garantia_ate ?? null,
        m.localizacao ?? null, m.proxima_manutencao ?? null, m.ultima_manutencao ?? null, m.mtbf ?? null,
        m.mttr ?? null, m.valor_aquisicao ?? null, m.custo_acumulado_manut ?? null, m.observacoes ?? null,
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
    const [rows] = await conn.query<MaquinaRow[]>(
      `SELECT * FROM maquinas WHERE id = ?`,
      [id]
    );
    return rows[0] ?? null;
  } finally {
    conn.release();
  }
};

export const existeNumeroSerie = async (numero_serie: string, ignoreId?: number) => {
  const conn = await pool.getConnection();
  try {
    const params: any[] = [numero_serie];
    let sql = `SELECT id FROM maquinas WHERE numero_serie = ?`;
    if (ignoreId) { sql += ` AND id <> ?`; params.push(ignoreId); }
    const [rows] = await conn.query<MaquinaRow[]>(sql, params);
    return rows.length > 0;
  } finally {
    conn.release();
  }
};

export const atualizar = async (id: number, m: MaquinaBase) => {
  const conn = await pool.getConnection();
  try {
    const [result] = await conn.query<ResultSetHeader>(
      `
      UPDATE maquinas
         SET codigo_interno = ?, nome = ?, descricao = ?, tipo = ?, setor = ?, fabricante = ?, modelo = ?,
             numero_serie = ?, ano_fabricacao = ?, capacidade_producao = ?, tensao = ?, potencia_kw = ?,
             horimetro_atual = ?, vida_util_estimada = ?, status = ?, data_aquisicao = ?, garantia_ate = ?,
             localizacao = ?, proxima_manutencao = ?, ultima_manutencao = ?, mtbf = ?, mttr = ?,
             valor_aquisicao = ?, custo_acumulado_manut = ?, observacoes = ?, atualizado_em = NOW()
       WHERE id = ?
      `,
      [
        m.codigo_interno, m.nome, m.descricao ?? null, m.tipo ?? null, m.setor ?? null, m.fabricante ?? null,
        m.modelo ?? null, m.numero_serie, m.ano_fabricacao ?? null, m.capacidade_producao ?? null,
        m.tensao ?? null, m.potencia_kw ?? null, m.horimetro_atual ?? null, m.vida_util_estimada ?? null,
        m.status ?? null, m.data_aquisicao ?? null, m.garantia_ate ?? null, m.localizacao ?? null,
        m.proxima_manutencao ?? null, m.ultima_manutencao ?? null, m.mtbf ?? null, m.mttr ?? null,
        m.valor_aquisicao ?? null, m.custo_acumulado_manut ?? null, m.observacoes ?? null, id
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
      `DELETE FROM maquinas WHERE id = ?`,
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

  if (p.busca) {
    filtros.push(`(nome LIKE ? OR modelo LIKE ? OR numero_serie LIKE ? OR codigo_interno LIKE ?)`);
    const like = `%${p.busca}%`;
    params.push(like, like, like, like);
  }
  if (p.setor) { filtros.push(`setor = ?`); params.push(p.setor); }
  if (p.tipo) { filtros.push(`tipo = ?`); params.push(p.tipo); }
  if (p.status) { filtros.push(`status = ?`); params.push(p.status); }

  const where = filtros.length ? `WHERE ${filtros.join(' AND ')}` : '';

  const conn = await pool.getConnection();
  try {
    const [[{ total }]] = await conn.query<any[]>(
      `SELECT COUNT(*) AS total FROM maquinas ${where}`,
      params
    );

    const [rows] = await conn.query<MaquinaRow[]>(
      `
        SELECT *
          FROM maquinas
          ${where}
      ORDER BY criado_em DESC
         LIMIT ? OFFSET ?
      `,
      [...params, limit, offset]
    );

    return { total, pagina, quantidadePorPagina: limit, itens: rows };
  } finally {
    conn.release();
  }
};

export const atualizarStatusApenas = async (id: number, novoStatus: string | number) => {
  const conn: PoolConnection = await pool.getConnection();
  try {
    const [result] = await conn.query<ResultSetHeader>(
      `UPDATE maquinas SET status = ?, atualizado_em = NOW() WHERE id = ?`,
      [novoStatus, id]
    );
    return result.affectedRows > 0;
  } finally {
    conn.release();
  }
};
