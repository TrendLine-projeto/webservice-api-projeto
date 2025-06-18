import * as TipoProdutosModel  from '../../models/tipoProdutos';

export const buscarTiposPorCategoria = async (categoria: string) => {
  const tipos = await TipoProdutosModel.buscarTiposPorCategoriaDb(categoria);
  return tipos;
};