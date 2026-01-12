import * as ProdutosSupriModel from '../../models/produtosSupri';
import * as NotificacoesService from '../notificacoes/notificacoes';

const criarNotificacaoProdutoSupri = async (
  acao: 'Criacao' | 'Edicao' | 'Alteracao',
  payload: { idCliente?: number | null; nomeProduto?: string },
  idProduto?: number
) => {
  if (!payload?.idCliente) return;
  const nome = payload.nomeProduto || (idProduto ? `produto ${idProduto}` : 'produto');
  await NotificacoesService.criar({
    descricao: `${acao} de produto de suprimentos: ${nome}`,
    url: '/fornecedoressuprimentos',
    tipo: acao,
    idCliente: Number(payload.idCliente)
  });
};

export const criarProduto = async (produto: any) => {

  if (!produto.nomeProduto || !produto.descricao || !produto.fornecedor_id) {
    throw { tipo: 'Validacao', mensagem: 'nomeProduto, descricao e fornecedor_id são obrigatórios.' };
  }

  const fornecedorExiste = await ProdutosSupriModel.verificarFornecedor(produto.fornecedor_id);
  if (!fornecedorExiste) {
    throw { tipo: 'FornecedorNaoEncontrado', mensagem: 'Fornecedor não encontrado. Verifique o ID informado.' };
  }

  const resultado = await ProdutosSupriModel.inserirProduto(produto);
  const idCliente = await ProdutosSupriModel.buscarClientePorFornecedorId(produto.fornecedor_id);
  await criarNotificacaoProdutoSupri('Criacao', {
    idCliente,
    nomeProduto: produto.nomeProduto
  }, resultado.insertId);

  return {
    id: resultado.insertId,
    ...produto
  };
};

export const buscarProdutosPorCliente = async (filtros: any) => {
  if (!filtros.cliente_id) {
    throw { tipo: 'Validacao', mensagem: 'Cliente ID é obrigatório.' };
  }

  const { totalResult, produtosResult } = await ProdutosSupriModel.buscarProdutosPorCliente(filtros);

  const totalRegistros = (totalResult as any[])[0]?.total || 0;

  return {
    totalRegistros,
    produtos: produtosResult
  };
};

export const buscarProdutosSimplesPorFornecedor = async (fornecedor_id: number) => {
  if (!fornecedor_id) {
    throw { tipo: 'Validacao', mensagem: 'Fornecedor ID é obrigatório.' };
  }

  const produtos = await ProdutosSupriModel.buscarProdutosSimplesPorFornecedor(fornecedor_id);
  return produtos;
};
