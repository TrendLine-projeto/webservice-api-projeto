import * as TipoProdutosModel  from '../../models/tipoProdutos';
import { ConferenciaEstoqueParams, ConferenciaPayload } from '../../types/estoque/ConferenciaEstoqueParams'

export const buscarTiposPorCategoria = async (categoria: string) => {
  const tipos = await TipoProdutosModel.buscarTiposPorCategoriaDb(categoria);
  return tipos;
};

export const buscarConferenciaEstoqueService = async (params: ConferenciaEstoqueParams) => {
  return await TipoProdutosModel.buscarConferenciaEstoqueModel(params);
};

export const registrarConferencia = async (payload: ConferenciaPayload) => {
    const {
        id_produto,
        quantidade_sistema,
        quantidade_conferida,
        tabela_origem,
        id_cliente
    } = payload;

    await TipoProdutosModel.salvarRegistroConferencia(payload);

    await TipoProdutosModel.atualizarQuantidadeEstoque(tabela_origem, id_produto, quantidade_conferida);

    return {
        id_produto,
        quantidade_sistema,
        quantidade_conferida,
        tabela_origem,
        id_cliente
    };
};