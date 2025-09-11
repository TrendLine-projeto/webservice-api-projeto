import pool from '../connect/mysql';
import { PoolConnection, ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { EntradaDeLote } from '../types/lotes/EntradaDeLote';

export const verificarFilialPorId = async (idFilial: number): Promise<boolean> => {
  const conn: PoolConnection = await pool.getConnection();
  try {
    const [rows] = await conn.query('SELECT id FROM filiais WHERE id = ?', [idFilial]);
    return (rows as any[]).length > 0;
  } finally {
    conn.release();
  }
};

export const inserirLote = async (entradaDeLote: EntradaDeLote): Promise<ResultSetHeader> => {
  const conn: PoolConnection = await pool.getConnection();

  try {
    const query = `
      INSERT INTO entrada_lotes (
        numeroIdentificador,
        nomeEntregador,
        nomeRecebedor,
        valorEstimado,
        valorHoraEstimado,
        dataEntrada,
        dataPrevistaSaida,
        dataInicio,
        loteIniciado,
        idFilial,
        idFornecedor_producao
      ) VALUES (?, ?, ?, ?, ?, NOW(), NOW(), ?, ?, ?, ?)
    `;

    const dataInicio = entradaDeLote.loteIniciado ? new Date() : null;

    const valores = [
      entradaDeLote.numeroIdentificador,
      entradaDeLote.nomeEntregador,
      entradaDeLote.nomeRecebedor,
      entradaDeLote.valorEstimado,
      entradaDeLote.valorHoraEstimado,
      dataInicio,
      entradaDeLote.loteIniciado,
      entradaDeLote.idFilial,
      entradaDeLote.idFornecedor_producao
    ];

    const [result] = await conn.query<ResultSetHeader>(query, valores);
    return result;
  } finally {
    conn.release();
  }
};

export const buscarLotesPorCliente = async (filtros: any) => {
  const {
    idFilial,
    pagina = 1,
    quantidadePorPagina = 10,
    numeroIdentificador,
    nomeEntregador,
    nomeRecebedor,
    valorEstimado,
    dataEntrada,
    dataPrevistaSaida,
    loteIniciado,
    loteFinalizado
  } = filtros;

  const offset = (pagina - 1) * quantidadePorPagina;

  let where = 'WHERE idFilial = ?';
  const params = [idFilial];

  if (numeroIdentificador) {
    where += ' AND numeroIdentificador LIKE ?';
    params.push(`%${numeroIdentificador}%`);
  }
  if (nomeEntregador) {
    where += ' AND nomeEntregador LIKE ?';
    params.push(`%${nomeEntregador}%`);
  }
  if (nomeRecebedor) {
    where += ' AND nomeRecebedor = ?';
    params.push(nomeRecebedor);
  }
  if (valorEstimado) {
    where += ' AND valorEstimado = ?';
    params.push(valorEstimado);
  }
  if (dataEntrada) {
    where += ' AND dataEntrada = ?';
    params.push(dataEntrada);
  }
  if (dataPrevistaSaida) {
    where += ' AND dataPrevistaSaida = ?';
    params.push(dataPrevistaSaida);
  }
  if (loteIniciado !== null && loteIniciado !== undefined) {
    where += ' AND loteIniciado = ?';
    params.push(loteIniciado);
  }
  if (loteFinalizado !== null && loteFinalizado !== undefined) {
    where += ' AND loteFinalizado = ?';
    params.push(loteFinalizado);
  }

  const queryBusca = `
    SELECT * FROM entrada_lotes 
    ${where}
    ORDER BY id DESC
    LIMIT ? OFFSET ?
  `;

  const queryTotal = `
    SELECT COUNT(*) AS total FROM entrada_lotes
    ${where}
  `;

  const conn: PoolConnection = await pool.getConnection();

  try {
    const [totalResult] = await conn.query<RowDataPacket[]>(queryTotal, params);
    const [lotes] = await conn.query<RowDataPacket[]>(queryBusca, [...params, quantidadePorPagina, offset]);

    return {
      totalRegistros: totalResult[0].total,
      lotes
    };
  } finally {
    conn.release();
  }
};

export const inserirProdutosNoLote = async (idLote: number, produtos: any[]) => {
  const conn: PoolConnection = await pool.getConnection();

  try {
    const query = `
            INSERT INTO produtos_producao (
                numeroIdentificador, nomeProduto, tipoEstilo, tamanho, corPrimaria, corSecundaria,
                valorPorPeca, quantidadeProduto, someValorTotalProduto, dataEntrada, dataPrevistaSaida, dataSaida,
                imagem, iniciado, finalizado, marca, pesoLiquido, pesoBruto, volumes, itensPorCaixa, descricaoCurta,
                largura, altura, profundidade, estoqueMinimo, estoqueMaximo, estoqueCrossdocking, estoqueLocalizacao, idEntrada_lotes, idFilial
            ) VALUES ?
        `;

    const valores = produtos.map(produto => [
      produto.numeroIdentificador,
      produto.nomeProduto,
      produto.tipoEstilo,
      produto.tamanho,
      produto.corPrimaria,
      produto.corSecundaria,
      produto.valorPorPeca,
      produto.quantidadeProduto,
      produto.someValorTotalProduto,
      new Date(), // dataEntrada
      produto.dataPrevistaSaida || null,
      produto.dataSaida || null,
      produto.imagem || null,
      produto.iniciado || 0,
      produto.finalizado || 0,

      produto.marca || null,
      produto.pesoLiquido || 0,
      produto.pesoBruto || 0,
      produto.volumes || 0,
      produto.itensPorCaixa || 0,
      produto.descricaoCurta || null,
      produto.largura || 0,
      produto.altura || 0,
      produto.profundidade || 0,
      produto.estoqueMinimo || 0,
      produto.estoqueMaximo || 0,
      produto.estoqueCrossdocking || 0,
      produto.estoqueLocalizacao || null,

      idLote,
      produto.idFilial
    ]);

    await conn.query(query, [valores]);
  } finally {
    conn.release();
  }
};

export const verificarProdutosEmAberto = async (idLote: number) => {
  const conn: PoolConnection = await pool.getConnection();

  try {
    const [produtos] = await conn.query(
      `SELECT id FROM produtos_producao 
       WHERE idEntrada_lotes = ? AND (finalizado IS NULL OR finalizado = 0)`,
      [idLote]
    );

    return produtos as any[];
  } finally {
    conn.release();
  }
};

export const encerrarLote = async (idLote: number) => {
  const conn: PoolConnection = await pool.getConnection();

  try {
    await conn.query(
      `UPDATE entrada_lotes SET loteFinalizado = true, dataSaida = NOW() WHERE id = ?`,
      [idLote]
    );
  } finally {
    conn.release();
  }
};

export const reabrirLote = async (idLote: number) => {
  const conn: PoolConnection = await pool.getConnection();

  try {
    await conn.query(
      `UPDATE entrada_lotes SET loteIniciado = true, loteFinalizado = false WHERE id = ?`,
      [idLote]
    );
  } finally {
    conn.release();
  }
};

export const buscarLotePorId = async (idLote: number) => {
  const conn: PoolConnection = await pool.getConnection();

  try {
    const [result] = await conn.query(
      `SELECT * FROM entrada_lotes WHERE id = ?`,
      [idLote]
    );

    if ((result as any[]).length === 0) {
      return null;
    }

    return (result as any[])[0];
  } finally {
    conn.release();
  }
};

export const deletarPorId = async (idLote: number) => {
  const conn: PoolConnection = await pool.getConnection();

  try {
    const [result] = await conn.query(
      `SELECT * FROM entrada_lotes WHERE id = ?`,
      [idLote]
    );

    if ((result as any[]).length === 0) {
      return null;
    }

    return (result as any[])[0];
  } finally {
    conn.release();
  }
};

export const verificarProdutosNaoFinalizados = async (idLote: number) => {
  const conn: PoolConnection = await pool.getConnection();

  try {
    const [result] = await conn.query(
      `SELECT id FROM produtos_producao 
       WHERE idEntrada_lotes = ? AND (finalizado IS NULL OR finalizado = 0)`,
      [idLote]
    );

    return result as any[];
  } finally {
    conn.release();
  }
};

export const deletarProdutosDoLote = async (idLote: number) => {
  const conn: PoolConnection = await pool.getConnection();

  try {
    await conn.query(
      `DELETE FROM produtos_producao WHERE idEntrada_lotes = ?`,
      [idLote]
    );
  } finally {
    conn.release();
  }
};

export const deletarLotePorId = async (idLote: number) => {
  const conn: PoolConnection = await pool.getConnection();

  try {
    await conn.query(
      `DELETE FROM entrada_lotes WHERE id = ?`,
      [idLote]
    );
  } finally {
    conn.release();
  }
};