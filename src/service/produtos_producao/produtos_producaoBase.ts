import * as ProdutosSupriModel from '../../models/produtosProducao';
import { ProdutoProducao } from '../../types/ProdutoProducao/ProdutoProducao';

export const criarProduto = async (entradaProduto: ProdutoProducao) => {
    if (!entradaProduto.idEntrada_lotes) {
        throw { tipo: 'Validacao', mensagem: 'Identificação do lote principal é obrigatória' };
    }

    // Verifica se o lote existe
    const loteExiste = await ProdutosSupriModel.verificarLotePorId(entradaProduto.idEntrada_lotes);

    if (!loteExiste) {
        throw { tipo: 'LotePrincipal', mensagem: 'Lote principal não encontrado. Verifique o ID informado.' };
    }

    // Cria o produto no banco
    const resultado = await ProdutosSupriModel.inserirProduto(entradaProduto);

    return {
        id: resultado.insertId,
        ...entradaProduto
    };
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

export const deletarProdutoPorId = async (id: number): Promise<boolean> => {
    const produto = await ProdutosSupriModel.buscarProdutoPorId(id);

    if (!produto) {
        return false;
    }

    await ProdutosSupriModel.deletarPorId(id);
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