// src/services/lotes/helpers/integrarProdutosNoBling.ts
import * as produtoModel from '../models/produtosProducao';
import { ProdutoProducao } from '../types/ProdutoProducao/ProdutoProducao';
import { mapProdutoToBlingPayload } from '../integration/bling/produtos/bling-product.dto';
import { createBlingProductsBatch } from '../integration/bling/produtos/produtos.api';

export async function integrarProdutosNoBling(
  produtos: ProdutoProducao[],
  idsLocais: number[],
  { concurrency = 3 }: { concurrency?: number } = {}
) {
  const batchItems = produtos.map((prod, idx) => {
    const idLocal = idsLocais[idx];
    const payload = mapProdutoToBlingPayload(prod, idLocal);
    payload.codigo = String(payload.codigo).trim();
    return { idLocal, payload };
  });

  const resultados = await createBlingProductsBatch(batchItems, { concurrency });

  for (const r of resultados) {
    if (r.ok && r.blingId) {
      await produtoModel.atualizarBlingIdentify(r.idLocal, r.blingId);
    } else if (typeof (produtoModel as any).marcarBlingFalha === 'function') {
      await (produtoModel as any).marcarBlingFalha(r.idLocal, r.error ?? 'erro_desconhecido');
    }
  }

  return resultados;
}