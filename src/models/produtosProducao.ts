import pool from '../connect/mysql';
import { PoolConnection, RowDataPacket, ResultSetHeader} from 'mysql2/promise';
import { ProdutoProducao } from '../types/ProdutoProducao/ProdutoProducao';

export const verificarLotePorId = async (idLote: number): Promise<boolean> => {
  const conn: PoolConnection = await pool.getConnection();
  try {
    const [rows] = await conn.query('SELECT id FROM entrada_lotes WHERE id = ?', [idLote]);
    return (rows as any[]).length > 0;
  } finally {
    conn.release();
  }
};

export const inserirProduto = async (produto: ProdutoProducao): Promise<any> => {
  const conn: PoolConnection = await pool.getConnection();
  try {
    const query = `
            INSERT INTO produtos_producao (
                numeroIdentificador,
                nomeProduto,
                tipoEstilo,
                tamanho,
                corPrimaria,
                corSecundaria,
                valorPorPeca,
                quantidadeProduto,
                someValorTotalProduto,
                dataEntrada,
                dataPrevistaSaida,
                dataSaida,
                imagem,
                finalizado,

                marca,
                pesoLiquido,
                pesoBruto,
                volumes,
                itensPorCaixa,
                descricaoCurta,
                largura,
                altura,
                profundidade,
                estoqueMinimo,
                estoqueMaximo,
                estoqueCrossdocking,
                estoqueLocalizacao,

                idEntrada_lotes,
                idFilial
            ) VALUES (   ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?, ?, ?, ?,        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,         ?, ?)
        `;

    const valores = [
      produto.numeroIdentificador,
      produto.nomeProduto,
      produto.tipoEstilo,
      produto.tamanho,
      produto.corPrimaria,
      produto.corSecundaria,
      produto.valorPorPeca,
      produto.quantidadeProduto,
      produto.someValorTotalProduto,
      produto.dataPrevistaSaida,
      produto.dataSaida,
      produto.imagem,
      produto.finalizado,

      produto.marca,
      produto.pesoLiquido,
      produto.pesoBruto,
      produto.volumes,
      produto.itensPorCaixa,
      produto.descricaoCurta,
      produto.largura,
      produto.altura,
      produto.profundidade,
      produto.estoqueMinimo,
      produto.estoqueMaximo,
      produto.estoqueCrossdocking,
      produto.estoqueLocalizacao,

      produto.idEntrada_lotes,
      produto.idFilial
    ];

    const [result] = await conn.query(query, valores);
    return result;
  } finally {
    conn.release();
  }
};

export const criarProduto = async (entradaDeProduto: ProdutoProducao, callback: Function) => {
  try {
    const conn: PoolConnection = await pool.getConnection();

    const [queryVerificaLotePrincipal] = await conn.query(
      `SELECT id FROM entrada_lotes WHERE id = ?`,
      [entradaDeProduto.idEntrada_lotes]
    )

    if ((queryVerificaLotePrincipal as any[]).length === 0) {
      conn.release();
      return callback({ tipo: 'LotePrincipal', mensagem: 'Lote principal não encontrada. Verifique o ID informado.' });
    }

    const queryInserirLote = `
      INSERT INTO produtos_producao (
          numeroIdentificador,
          nomeProduto,
          tipoEstilo,
          tamanho,
          corPrimaria,
          corSecundaria,
          valorPorPeca,
          quantidadeProduto,
          dataEntrada,
          dataPrevistaSaida,
          dataSaida,
          imagem,
          finalizado,
          idEntrada_lotes,
          idFilial
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?, ?, ?, ?, ?, ?)
    `;

    const valores = [
      entradaDeProduto.numeroIdentificador,
      entradaDeProduto.nomeProduto,
      entradaDeProduto.tipoEstilo,
      entradaDeProduto.tamanho,
      entradaDeProduto.corPrimaria,
      entradaDeProduto.corSecundaria,
      entradaDeProduto.valorPorPeca,
      entradaDeProduto.quantidadeProduto,
      entradaDeProduto.dataPrevistaSaida,
      entradaDeProduto.dataSaida,
      entradaDeProduto.imagem,
      entradaDeProduto.finalizado,
      entradaDeProduto.idEntrada_lotes,
      entradaDeProduto.idFilial
    ];

    const [results] = await conn.query(queryInserirLote, valores);
    conn.release();

    return callback(null, results)
  } catch (error) {
    return callback(error);
  }
};

export const buscarProdutosPorCliente = async (filtros: any): Promise<{ totalRegistros: number; produtos: RowDataPacket[] }> => {
  const {
    idFilial,
    pagina,
    quantidadePorPagina,
    numeroIdentificador,
    nomeProduto,
    tipoEstilo,
    tamanho,
    corPrimaria,
    corSecundaria,
    valorPorPeca,
    quantidadeProduto,
    dataEntrada,
    dataSaida,
    finalizado,
  } = filtros;

  const offset = (pagina - 1) * quantidadePorPagina;

  let where = 'WHERE idFilial = ?';
  const params: any[] = [idFilial];

  if (numeroIdentificador) {
    where += ' AND numeroIdentificador LIKE ?';
    params.push(`%${numeroIdentificador}%`);
  }
  if (nomeProduto) {
    where += ' AND nomeProduto LIKE ?';
    params.push(`%${nomeProduto}%`);
  }
  if (tipoEstilo) {
    where += ' AND tipoEstilo = ?';
    params.push(tipoEstilo);
  }
  if (tamanho) {
    where += ' AND tamanho = ?';
    params.push(tamanho);
  }
  if (corPrimaria) {
    where += ' AND corPrimaria = ?';
    params.push(corPrimaria);
  }
  if (corSecundaria) {
    where += ' AND corSecundaria = ?';
    params.push(corSecundaria);
  }
  if (valorPorPeca) {
    where += ' AND valorPorPeca = ?';
    params.push(valorPorPeca);
  }
  if (dataEntrada) {
    where += ' AND dataEntrada = ?';
    params.push(dataEntrada);
  }
  if (quantidadeProduto) {
    where += ' AND quantidadeProduto = ?';
    params.push(quantidadeProduto);
  }
  if (dataSaida) {
    where += ' AND dataSaida = ?';
    params.push(dataSaida);
  }
  if (finalizado !== null && finalizado !== undefined) {
    where += ' AND finalizado = ?';
    params.push(finalizado);
  }

  const queryBusca = `
        SELECT 
            id, numeroIdentificador, nomeProduto, tipoEstilo, tamanho, corPrimaria, corSecundaria, 
            valorPorPeca, quantidadeProduto, dataEntrada, dataPrevistaSaida, dataSaida, imagem, 
            finalizado, idEntrada_lotes, idFilial
        FROM produtos_producao
        ${where}
        ORDER BY id DESC
        LIMIT ? OFFSET ?
    `;

  const queryTotal = `SELECT COUNT(*) AS total FROM produtos_producao ${where}`;

  const conn: PoolConnection = await pool.getConnection();
  try {
    const [totalResult] = await conn.query<RowDataPacket[]>(queryTotal, params);
    const [produtosResult] = await conn.query<RowDataPacket[]>(queryBusca, [...params, quantidadePorPagina, offset]);

    const totalRegistros = totalResult[0].total;

    return {
      totalRegistros,
      produtos: produtosResult
    };
  } finally {
    conn.release();
  }
};

export const buscarProdutoPorId = async (idProdutoProducao: number): Promise<RowDataPacket | null> => {
  const conn: PoolConnection = await pool.getConnection();

  try {
    const [result] = await conn.query<RowDataPacket[]>(
      `SELECT * FROM produtos_producao WHERE id = ?`,
      [idProdutoProducao]
    );

    return result.length > 0 ? result[0] : null;
  } finally {
    conn.release();
  }
};

// **Atualizar por id** (dinâmico e seguro)
export const atualizarProdutoPorId = async (
  idProdutoProducao: number,
  dados: Record<string, any>
): Promise<void> => {
  const conn: PoolConnection = await pool.getConnection();
  try {
    // Mapeamento 1:1 dos campos do body para as colunas (assumindo nomes iguais às chaves do body).
    // Se suas colunas no banco tiverem nomes diferentes, ajuste o mapa abaixo.
    const mapaColunas: Record<string, string> = {
      numeroIdentificador: 'numeroIdentificador',
      nomeProduto: 'nomeProduto',
      tipoEstilo: 'tipoEstilo',
      tamanho: 'tamanho',
      corPrimaria: 'corPrimaria',
      corSecundaria: 'corSecundaria',
      valorPorPeca: 'valorPorPeca',
      quantidadeProduto: 'quantidadeProduto',
      someValorTotalProduto: 'someValorTotalProduto',
      dataEntrada: 'dataEntrada',
      dataPrevistaSaida: 'dataPrevistaSaida',
      dataSaida: 'dataSaida',
      imagem: 'imagem',
      iniciado: 'iniciado',
      finalizado: 'finalizado',
      blingIdentify: 'blingIdentify',
      marca: 'marca',
      pesoLiquido: 'pesoLiquido',
      pesoBruto: 'pesoBruto',
      volumes: 'volumes',
      itensPorCaixa: 'itensPorCaixa',
      descricaoCurta: 'descricaoCurta',
      largura: 'largura',
      altura: 'altura',
      profundidade: 'profundidade',
      estoqueMinimo: 'estoqueMinimo',
      estoqueMaximo: 'estoqueMaximo',
      estoqueCrossdocking: 'estoqueCrossdocking',
      estoqueLocalizacao: 'estoqueLocalizacao',
      idEntrada_lotes: 'idEntrada_lotes',
      idFilial: 'idFilial',
    };

    const sets: string[] = [];
    const params: any[] = [];

    Object.entries(dados).forEach(([campo, valor]) => {
      const coluna = mapaColunas[campo];
      if (coluna) {
        sets.push(`\`${coluna}\` = ?`);
        params.push(valor);
      }
    });

    if (sets.length === 0) {
      // Nada para atualizar — retorna silenciosamente
      return;
    }

    params.push(idProdutoProducao);

    const sql = `
      UPDATE produtos_producao
         SET ${sets.join(', ')}
       WHERE id = ?
      LIMIT 1
    `;

    const [result] = await conn.query<ResultSetHeader>(sql, params);

    if (result.affectedRows === 0) {
      // Não encontrou o registro — opcional jogar erro
      // throw new Error('Registro não encontrado para atualização');
    }
  } finally {
    conn.release();
  }
};

export const deletarPorId = async (idProduto: number): Promise<void> => {
  const conn: PoolConnection = await pool.getConnection();

  try {
    await conn.query(`DELETE FROM produtos_producao WHERE id = ?`, [idProduto]);
  } finally {
    conn.release();
  }
};

export const buscarProdutosPorLoteIds = async (loteIds: number[]) => {
  if (!loteIds.length) return {};

  const placeholders = loteIds.map(() => '?').join(',');
  const query = `
    SELECT * FROM produtos_producao
    WHERE idEntrada_lotes IN (${placeholders})
  `;

  const conn: PoolConnection = await pool.getConnection();
  try {
    const [result] = await conn.query<RowDataPacket[]>(query, loteIds);
    const produtos = result;

    const produtosPorLote: Record<number, any[]> = {};
    for (const p of produtos) {
      if (!produtosPorLote[p.idEntrada_lotes]) {
        produtosPorLote[p.idEntrada_lotes] = [];
      }
      produtosPorLote[p.idEntrada_lotes].push(p);
    }

    return produtosPorLote;
  } finally {
    conn.release();
  }
};

export const atualizarBlingIdentify = async (idProduto: number, blingId: number) => {
  const [result]: any = await pool.query(
    'UPDATE produtos_producao SET blingIdentify = ? WHERE id = ?',
    [blingId, idProduto],
  );
  return result.affectedRows === 1;
}

/*export const inserirProdutosNoLote = async (idLote: number, produtos: ProdutoProducao[]) => {
    const conn: PoolConnection = await pool.getConnection();

    try {
        for (const produto of produtos) {
            const query = `
        INSERT INTO produtos_producao (
          numeroIdentificador, nomeProduto, tipoEstilo, tamanho, corPrimaria, corSecundaria,
          valorPorPeca, quantidadeProduto, dataEntrada, dataPrevistaSaida, dataSaida, imagem, finalizado, idEntrada_lotes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

            const values = [
                `PROD-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
                produto.nomeProduto,
                produto.tipoEstilo,
                produto.tamanho,
                produto.corPrimaria,
                produto.corSecundaria || null,
                produto.valorPorPeca,
                produto.quantidadeProduto,
                produto.dataEntrada || new Date(),
                produto.dataPrevistaSaida || null,
                produto.dataSaida || null,
                produto.imagem || null,
                produto.finalizado || null,
                idLote
            ];

            await conn.query(query, values);
        }
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
}; */