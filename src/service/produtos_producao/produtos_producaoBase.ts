import * as ProdutosSupriModel from '../../models/produtosProducao';
import { ProdutoProducao } from '../../types/ProdutoProducao/ProdutoProducao';
import { createBlingProduct } from '../../integration/bling/produtos/produtos.api';
import { mapProdutoToBlingPayload }from '../../integration/bling/produtos/bling-product.dto'
import * as NotificacoesService from '../notificacoes/notificacoes';

const toMySQLDateTime = (val: any, fieldName: string) => {
  if (val === null || val === undefined || val === '') return null;
  const d = new Date(val);
  if (isNaN(d.getTime())) {
    throw { tipo: 'Validacao', mensagem: `Data inválida no campo ${fieldName}` };
  }
  // '2025-08-13 20:58:47'
  return d.toISOString().slice(0, 19).replace('T', ' ');
};

const toNumberOrNull = (val: any) => {
  if (val === null || val === undefined || val === '') return null;
  const n = Number(val);
  return isNaN(n) ? null : n;
};

const buscarIdClientePorFilial = async (idFilial?: number | null) => {
  if (!idFilial) return null;
  const idCliente = await ProdutosSupriModel.buscarClientePorFilialId(Number(idFilial));
  const n = Number(idCliente);
  return Number.isFinite(n) && n > 0 ? n : null;
};

const criarNotificacaoProdutoProducao = async (
  acao: 'Criacao' | 'Edicao' | 'Alteracao',
  payload: { idCliente?: number | null; nomeProduto?: string },
  idProduto?: number
) => {
  if (!payload?.idCliente) return;
  const nome = payload.nomeProduto || (idProduto ? `produto ${idProduto}` : 'produto');
  await NotificacoesService.criar({
    descricao: `${acao} de produto de producao: ${nome}`,
    url: '/lotes/lotesacompanhamento',
    tipo: acao,
    idCliente: Number(payload.idCliente)
  });
};

export const criarProduto = async (entradaProduto: ProdutoProducao) => {
  if (!entradaProduto.idEntrada_lotes) {
    throw { tipo: 'Validacao', mensagem: 'Identificação do lote principal é obrigatória' };
  }

  const loteExiste = await ProdutosSupriModel.verificarLotePorId(entradaProduto.idEntrada_lotes);
  if (!loteExiste) {
    throw { tipo: 'LotePrincipal', mensagem: 'Lote principal não encontrado. Verifique o ID informado.' };
  }

  const resultado = await ProdutosSupriModel.inserirProduto(entradaProduto);
  const produtoLocalId = resultado.insertId;
  const idCliente = await buscarIdClientePorFilial(entradaProduto.idFilial);
  await criarNotificacaoProdutoProducao('Criacao', {
    idCliente,
    nomeProduto: entradaProduto.nomeProduto
  }, produtoLocalId);
  const payloadBling = mapProdutoToBlingPayload(entradaProduto, produtoLocalId);

  try {
    const criado = await createBlingProduct(payloadBling);
    const blingId = Number(criado?.data?.id);

    if (!blingId) {
      return { id: produtoLocalId, blingSync: 'failed', error: 'Bling sem id' };
    }

    const ok = await ProdutosSupriModel.atualizarBlingIdentify(produtoLocalId, blingId);

    if (!ok) {
      return { id: produtoLocalId, BlingProdutoId: null, blingSync: 'update_failed' };
    }
    
    return { id: produtoLocalId, BlingProdutoId: blingId, ...entradaProduto };

  } catch (e: any) {
    return { id: produtoLocalId, blingSync: 'failed', error: String(e) };
  }
};

export const buscarProdutosPorCliente = async (filtros: any) => {
    const {
        idFilial,
        pagina = 1,
        quantidadePorPagina = 10,
        ...outrosFiltros
    } = filtros;

    if (!idFilial) {
        throw { tipo: 'Validacao', mensagem: 'Filial ID é obrigatório.' };
    }

    const resultado = await ProdutosSupriModel.buscarProdutosPorCliente({
        idFilial,
        pagina,
        quantidadePorPagina,
        ...outrosFiltros
    });

    return {
        paginaAtual: pagina,
        quantidadePorPagina,
        totalRegistros: resultado.totalRegistros,
        produtos: resultado.produtos
    };
};

export const buscarProdutoPorId = async (id: number) => {
    if (!id || isNaN(id)) {
        throw { tipo: 'Validacao', mensagem: 'ID do produto inválido' };
    }

    const produto = await ProdutosSupriModel.buscarProdutoPorId(id);
    return produto;
};

export const atualizarProdutoPorId = async (id: number, body: ProdutoProducao) => {
  if (!id || isNaN(id)) {
    throw { tipo: 'Validacao', mensagem: 'ID do produto inválido' };
  }

  const existente = await ProdutosSupriModel.buscarProdutoPorId(id);
  if (!existente) return null;

  // lista branca permanece a mesma
  const camposPermitidos: (keyof ProdutoProducao)[] = [
    'numeroIdentificador','nomeProduto','tipoEstilo','tamanho','corPrimaria','corSecundaria',
    'valorPorPeca','quantidadeProduto','someValorTotalProduto',
    'dataEntrada','dataPrevistaSaida','dataSaida',
    'imagem','finalizado','marca',
    'pesoLiquido','pesoBruto','volumes','itensPorCaixa','descricaoCurta',
    'largura','altura','profundidade',
    'estoqueMinimo','estoqueMaximo','estoqueCrossdocking','estoqueLocalizacao',
    'idEntrada_lotes','idFilial',
  ];

  // 🔧 Normalização específica de campos
  const normalizado: Record<string, any> = {};
  for (const campo of camposPermitidos) {
    if (!Object.prototype.hasOwnProperty.call(body, campo)) continue;

    const valor = (body as any)[campo];

    if (campo === 'dataEntrada' || campo === 'dataPrevistaSaida' || campo === 'dataSaida') {
      normalizado[campo] = toMySQLDateTime(valor, campo);  // <-- resolve o erro do MySQL
      continue;
    }

    if (['valorPorPeca','someValorTotalProduto','pesoLiquido','pesoBruto','largura','altura','profundidade']
        .includes(campo as string)) {
      normalizado[campo] = toNumberOrNull(valor); // grava como number ou null
      continue;
    }

    if (['volumes','itensPorCaixa','quantidadeProduto','estoqueMinimo','estoqueMaximo','estoqueCrossdocking',
         'idEntrada_lotes','idFilial','iniciado','finalizado'].includes(campo as string)) {
      normalizado[campo] = (valor === '' || valor === null || valor === undefined) ? null : Number(valor);
      continue;
    }

    // demais campos ficam como vieram (string/null)
    normalizado[campo] = (valor === '') ? '' : valor;
  }

  if (Object.keys(normalizado).length === 0) {
    throw { tipo: 'Validacao', mensagem: 'Nenhum campo válido para atualização' };
  }

  await ProdutosSupriModel.atualizarProdutoPorId(id, normalizado);
  const idCliente = await buscarIdClientePorFilial(
    (normalizado.idFilial ?? existente.idFilial) as number | null
  );
  await criarNotificacaoProdutoProducao('Edicao', {
    idCliente,
    nomeProduto: normalizado.nomeProduto ?? existente.nomeProduto
  }, id);
  return await ProdutosSupriModel.buscarProdutoPorId(id);
};

export const deletarProdutoPorId = async (id: number): Promise<boolean> => {
    const produto = await ProdutosSupriModel.buscarProdutoPorId(id);

    if (!produto) {
        return false;
    }

    await ProdutosSupriModel.deletarPorId(id);
    const idCliente = await buscarIdClientePorFilial(produto.idFilial);
    await criarNotificacaoProdutoProducao('Alteracao', {
      idCliente,
      nomeProduto: produto.nomeProduto
    }, id);
    return true;
};

/* export const buscarProdutosPorCliente = async (filtros: any) => {
  if (!filtros.cliente_id) {
    throw { tipo: 'Validacao', mensagem: 'Cliente ID é obrigatório.' };
  }

  const { totalResult, produtosResult } = await ProdutosSupriModel.buscarProdutosPorCliente(filtros);

  const totalRegistros = (totalResult as any[])[0]?.total || 0;

  return {
    totalRegistros,
    produtos: produtosResult
  };
}; */

/* export const buscarProdutosSimplesPorFornecedor = async (fornecedor_id: number) => {
  if (!fornecedor_id) {
    throw { tipo: 'Validacao', mensagem: 'Fornecedor ID é obrigatório.' };
  }

  const produtos = await ProdutosSupriModel.buscarProdutosSimplesPorFornecedor(fornecedor_id);
  return produtos;
}; */
