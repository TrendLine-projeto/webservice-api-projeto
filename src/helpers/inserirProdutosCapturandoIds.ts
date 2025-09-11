// src/services/lotes/helpers/inserirProdutosCapturandoIds.ts
import * as produtoModel from '../models/produtosProducao';
import { ProdutoProducao } from '../types/ProdutoProducao/ProdutoProducao';

export async function inserirProdutosCapturandoIds(produtos: ProdutoProducao[]) {
  const idsLocais: number[] = [];
  for (const prod of produtos) {
    const res = await produtoModel.inserirProduto(prod);
    idsLocais.push(res.insertId);
  }
  return idsLocais;
}
