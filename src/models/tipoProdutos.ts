import pool from '../connect/mysql';
import { RowDataPacket } from 'mysql2/promise';
import { ConferenciaEstoqueParams, ItemEstoque } from '../types/estoque/ConferenciaEstoqueParams'

export const buscarTiposPorCategoriaDb = async (categoria: string): Promise<RowDataPacket[]> => {
  const conn = await pool.getConnection();
  try {
    const query = `
      SELECT id, nome FROM tipos_produto WHERE categoria = ? AND ativo = true ORDER BY nome ASC`;
    const [rows] = await conn.query<RowDataPacket[]>(query, [categoria]);
    return rows;
  } finally {
    conn.release();
  }
};

export const buscarConferenciaEstoqueModel = async ({
  tabela,
  idCliente,
  pagina,
  quantidadePorPagina
}: ConferenciaEstoqueParams) => {
  const tabelaAlvo = tabela === 1
    ? 'estoque_insumos'
    : tabela === 2
      ? 'estoque_materiaprima'
      : null;

  if (!tabelaAlvo) {
    throw new Error('Tabela inválida');
  }

  const paginaNum = Number(pagina);
  const porPaginaNum = Number(quantidadePorPagina);

  if (isNaN(paginaNum) || isNaN(porPaginaNum)) {
    throw new Error('Parâmetros de paginação inválidos');
  }

  const offset = (paginaNum - 1) * porPaginaNum;

  const [dados] = await pool.query<ItemEstoque[]>(
    `SELECT id, nome, unidade, quantidade, estoqueMinimo
     FROM ${tabelaAlvo}
     WHERE idCliente = ?
     ORDER BY nome ASC
     LIMIT ? OFFSET ?`,
    [idCliente, porPaginaNum, offset]
  );

  const [[{ total }]] = await pool.query<RowDataPacket[]>(
    `SELECT COUNT(*) as total FROM ${tabelaAlvo} WHERE idCliente = ?`,
    [idCliente]
  );

  const paginasTotais = Math.ceil(Number(total) / porPaginaNum);

  return {
    pagina: paginaNum,
    paginasTotais,
    totalRegistros: total,
    dados
  };
};

export const salvarRegistroConferencia = async ({ id_produto, quantidade_sistema, quantidade_conferida, tabela_origem, id_cliente }: any) => {
  const query = `
        INSERT INTO conferencias_estoque 
        (id_produto, quantidade_sistema, quantidade_conferida, tabela_origem, id_cliente, criado_em)
        VALUES (?, ?, ?, ?, ?, NOW())
      `;

  await pool.query(query, [
    id_produto,
    quantidade_sistema,
    quantidade_conferida,
    tabela_origem,
    id_cliente
  ]);
};

export const atualizarQuantidadeEstoque = async (tabela_origem: number, id_produto: number, novaQuantidade: number) => {
  const tabela = tabela_origem === 1 ? 'estoque_insumos' : 'estoque_materiaprima';
  const query = `UPDATE ${tabela} SET quantidade = ? WHERE id = ?`;
  await pool.query(query, [novaQuantidade, id_produto]);
};