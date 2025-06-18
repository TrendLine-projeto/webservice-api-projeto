import pool from '../connect/mysql';
import { PoolConnection, RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import { FiltrosInsumoTecnico } from '../types/estoque/EstoqueInsumoTecnico';

export const construirWhereMateriaPrima = (filtros: FiltrosInsumoTecnico): { where: string; params: any[] } => {
  const whereClauses: string[] = [];
  const params: any[] = [];

  if (filtros.idCliente) {
    whereClauses.push("emp.idCliente = ?");
    params.push(filtros.idCliente);
  }

  if (filtros.idFornecedor_suprimentos) {
    whereClauses.push("emp.idFornecedor_suprimentos = ?");
    params.push(filtros.idFornecedor_suprimentos);
  }

  if (filtros.nome) {
    whereClauses.push("emp.nome LIKE ?");
    params.push(`%${filtros.nome}%`);
  }

  if (filtros.tipo) {
    whereClauses.push("emp.tipo LIKE ?");
    params.push(`%${filtros.tipo}%`);
  }

  if (filtros.cor) {
    whereClauses.push("emp.cor LIKE ?");
    params.push(`%${filtros.cor}%`);
  }

  if (filtros.marca) {
    whereClauses.push("emp.marca LIKE ?");
    params.push(`%${filtros.marca}%`);
  }

  if (filtros.unidade) {
    whereClauses.push("emp.unidade LIKE ?");
    params.push(`%${filtros.unidade}%`);
  }

  if (filtros.localArmazenamento) {
    whereClauses.push("emp.localArmazenamento LIKE ?");
    params.push(`%${filtros.localArmazenamento}%`);
  }

  const where = whereClauses.length > 0 ? "WHERE " + whereClauses.join(" AND ") : "";

  return { where, params };
};

export const buscarPorId = async (id: number): Promise<RowDataPacket | null> => {
  const conn = await pool.getConnection();
  try {
    const query = `
      SELECT emp.*, fs.razaoSocial AS fornecedorNome, fs.ativo AS fornecedorAtivo
      FROM estoque_insumos emp
      JOIN fornecedor_suprimentos fs ON emp.idFornecedor_suprimentos = fs.id
      WHERE emp.id = ?
    `;

    const [rows] = await conn.query<RowDataPacket[]>(query, [id]);
    return rows.length > 0 ? rows[0] : null;
  } finally {
    conn.release();
  }
};

export const verificarFornecedorSuprimentosPorId = async (idFornecedor_suprimentos: number): Promise<boolean> => {
  const conn: PoolConnection = await pool.getConnection();
  try {
    const [rows] = await conn.query('SELECT id FROM fornecedor_suprimentos WHERE id = ?', [idFornecedor_suprimentos]);
    return (rows as RowDataPacket[]).length > 0;
  } finally {
    conn.release();
  }
};

export const estoqueInsumosPorId = async (id: number): Promise<{ insumoTecnico: RowDataPacket[] }> => {
  const queryBusca = `
    SELECT * FROM estoque_insumos WHERE id = ?
  `;

  const conn: PoolConnection = await pool.getConnection();
  try {
    const [insumoTecnico] = await conn.query(queryBusca, [id]);
    return {
      insumoTecnico: insumoTecnico as RowDataPacket[]
    };
  } catch (error) {
    throw error;
  } finally {
    conn.release();
  }
};

export const inserirInsumoTecnico = async (insumoTecnico: any): Promise<ResultSetHeader> => {
  const conn: PoolConnection = await pool.getConnection();
  try {
    const sql = `
      INSERT INTO estoque_insumos (
        nome,
        tipo,
        descricao,
        unidade,
        quantidade,
        estoqueMinimo,
        largura,
        comprimento,
        gramatura,
        cor,
        marca,
        localArmazenamento,
        codigoBarras,
        precoUnitario,
        fornecedor,
        dataUltimaEntrada,
        observacoes,
        idFornecedor_suprimentos,
        idCliente
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      insumoTecnico.nome,
      insumoTecnico.tipo,
      insumoTecnico.descricao,
      insumoTecnico.unidade,
      insumoTecnico.quantidade,
      insumoTecnico.estoqueMinimo,
      insumoTecnico.largura,
      insumoTecnico.comprimento,
      insumoTecnico.gramatura,
      insumoTecnico.cor,
      insumoTecnico.marca,
      insumoTecnico.localArmazenamento,
      insumoTecnico.codigoBarras,
      insumoTecnico.precoUnitario,
      insumoTecnico.fornecedor,
      insumoTecnico.dataUltimaEntrada,
      insumoTecnico.observacoes,
      insumoTecnico.idFornecedor_suprimentos,
      insumoTecnico.idCliente
    ];

    const [result] = await conn.query<ResultSetHeader>(sql, values);
    return result;
  } finally {
    conn.release();
  }
};

export const buscarTotal = async (filtros: FiltrosInsumoTecnico): Promise<number> => {
  const conn = await pool.getConnection();
  try {
    const { where, params } = construirWhereMateriaPrima(filtros);
    const query = `SELECT COUNT(*) AS total FROM estoque_insumos emp JOIN fornecedor_suprimentos fs ON emp.idFornecedor_suprimentos = fs.id ${where}`;
    const [rows] = await conn.query<RowDataPacket[]>(query, params);
    return rows[0].total;
  } finally {
    conn.release();
  }
};

export const buscarLista = async (filtros: FiltrosInsumoTecnico): Promise<RowDataPacket[]> => {
  const conn = await pool.getConnection();
  try {
    const { where, params } = construirWhereMateriaPrima(filtros);
    const offset = ((filtros.pagina || 1) - 1) * (filtros.quantidadePorPagina || 10);

    const query = `
      SELECT emp.*, fs.razaoSocial AS fornecedorNome, fs.ativo AS fornecedorAtivo
      FROM estoque_insumos emp
      JOIN fornecedor_suprimentos fs ON emp.idFornecedor_suprimentos = fs.id
      ${where}
      ORDER BY emp.id DESC
      LIMIT ? OFFSET ?
    `;

    const [rows] = await conn.query<RowDataPacket[]>(query, [...params, filtros.quantidadePorPagina, offset]);
    return rows;
  } finally {
    conn.release();
  }
};

export const excluirPorId = async (id: number): Promise<ResultSetHeader> => {
  const conn = await pool.getConnection();
  try {
    const [result] = await conn.query<ResultSetHeader>(
      "DELETE FROM estoque_insumos WHERE id = ?",
      [id]
    );
    return result;
  } finally {
    conn.release();
  }
};

export const atualizar = async (id: number, dados: any): Promise<boolean> => {
  const conn = await pool.getConnection();
  try {
    const [result] = await conn.query<ResultSetHeader>(
      `UPDATE estoque_insumos SET ? WHERE id = ?`,
      [dados, id]
    );
    return result.affectedRows > 0;
  } finally {
    conn.release();
  }
};

export const buscarPorFornecedor = async (idFornecedor_suprimentos: number): Promise<{ id: number; nome: string }[]> => {
  const conn = await pool.getConnection();
  try {
    const query = `
      SELECT id, nome
      FROM estoque_insumos
      WHERE idFornecedor_suprimentos = ?
    `;
    const [rows] = await conn.query<RowDataPacket[]>(query, [idFornecedor_suprimentos]);

    return rows as { id: number; nome: string }[];
  } finally {
    conn.release();
  }
};