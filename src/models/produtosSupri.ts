// models/produtosSupri.ts
import pool from '../connect/mysql';
import { PoolConnection, RowDataPacket } from 'mysql2/promise';

export const verificarFornecedor = async (fornecedorId: number): Promise<boolean> => {
  const conn: PoolConnection = await pool.getConnection();
  try {
    const [results] = await conn.query(
      'SELECT id FROM fornecedor_suprimentos WHERE id = ?',
      [fornecedorId]
    );
    return (results as any[]).length > 0;
  } finally {
    conn.release();
  }
};

export const inserirProduto = async (produto: any) => {
  const conn: PoolConnection = await pool.getConnection();
  try {
    const query = `
      INSERT INTO produtos_suprimentos (
        nomeProduto, descricao, codigoInterno, codigoFornecedor, unidadeMedida,
        precoUnitario, estoqueMinimo, estoqueAtual, ativo, fornecedor_id, dataCadastro
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `;

    const params = [
      produto.nomeProduto,
      produto.descricao,
      produto.codigoInterno,
      produto.codigoFornecedor,
      produto.unidadeMedida,
      produto.precoUnitario,
      produto.estoqueMinimo,
      produto.estoqueAtual,
      produto.ativo ?? true,
      produto.fornecedor_id
    ];

    const [results] = await conn.query(query, params);
    return results as { insertId: number };
  } finally {
    conn.release();
  }
};

export const buscarProdutosPorCliente = async (filtros: any) => {
  const {
    cliente_id,
    pagina = 1,
    quantidadePorPagina = 10,
    nomeProduto,
    codigoInterno,
    unidadeMedida,
    ativo
  } = filtros;

  const offset = (pagina - 1) * quantidadePorPagina;

  let where = 'WHERE fs.cliente_id = ?';
  const params: any[] = [cliente_id];

  if (nomeProduto) {
    where += ' AND ps.nomeProduto LIKE ?';
    params.push(`%${nomeProduto}%`);
  }
  if (codigoInterno) {
    where += ' AND ps.codigoInterno LIKE ?';
    params.push(`%${codigoInterno}%`);
  }
  if (unidadeMedida) {
    where += ' AND ps.unidadeMedida = ?';
    params.push(unidadeMedida);
  }
  if (ativo !== null && ativo !== undefined) {
    where += ' AND ps.ativo = ?';
    params.push(ativo);
  }

  const queryBusca = `
    SELECT 
      ps.id, ps.nomeProduto, ps.descricao, ps.codigoInterno, ps.codigoFornecedor, 
      ps.unidadeMedida, ps.precoUnitario, ps.estoqueMinimo, ps.estoqueAtual, ps.ativo, ps.dataCadastro
    FROM produtos_suprimentos ps
    INNER JOIN fornecedor_suprimentos fs ON ps.fornecedor_id = fs.id
    ${where}
    ORDER BY ps.id DESC
    LIMIT ? OFFSET ?
  `;

  const queryTotal = `
    SELECT COUNT(*) AS total
    FROM produtos_suprimentos ps
    INNER JOIN fornecedor_suprimentos fs ON ps.fornecedor_id = fs.id
    ${where}
  `;

  const conn: PoolConnection = await pool.getConnection();
  try {
    const [totalResult] = await conn.query(queryTotal, params);
    const [produtosResult] = await conn.query(queryBusca, [...params, quantidadePorPagina, offset]);

    return {
      totalResult,
      produtosResult
    };
  } finally {
    conn.release();
  }
};

export const buscarProdutosSimplesPorFornecedor = async (fornecedor_id: number): Promise<RowDataPacket[]> => {
  const conn: PoolConnection = await pool.getConnection();
  try {
    const query = `
      SELECT id, nomeProduto
      FROM produtos_suprimentos
      WHERE fornecedor_id = ?
      ORDER BY nomeProduto ASC
    `;

    const [results] = await conn.query(query, [fornecedor_id]);
    return results as RowDataPacket[];
  } finally {
    conn.release();
  }
};