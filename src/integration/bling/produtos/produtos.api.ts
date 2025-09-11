import { blingClient } from '../config/client';
import { BlingProductFlat } from '../types/bling.types';

export async function createBlingProduct(p: BlingProductFlat) {
  const body: any = {
    nome: p.nome,
    codigo: p.codigo,
    preco: p.preco ?? 0,
    unidade: p.unidade ?? 'UN',
    tipo: p.tipo ?? 'P',
    formato: p.formato ?? 'S',
    ...(p.descricao ? { descricao: p.descricao } : {}),
    ...(p.situacao ? { situacao: p.situacao } : {}),
    ...(p.marca ? { marca: p.marca } : {}),
    ...(p.producao ? { producao: p.producao } : {}),
    ...(p.dataValidade ? { dataValidade: p.dataValidade } : {}),
    ...(p.freteGratis !== undefined ? { freteGratis: p.freteGratis } : {}),
    ...(p.pesoLiquido ? { pesoLiquido: p.pesoLiquido } : {}),
    ...(p.pesoBruto ? { pesoBruto: p.pesoBruto } : {}),
    ...(p.volumes ? { volumes: p.volumes } : {}),
    ...(p.itensPorCaixa ? { itensPorCaixa: p.itensPorCaixa } : {}),
    ...(p.descricaoCurta ? { descricaoCurta: p.descricaoCurta } : {}),
    ...(p.gtin ? { gtin: p.gtin } : {}),
    ...(p.gtinTributario ? { gtinTributario: p.gtinTributario } : {}),
    ...(p.dimensoes ? { dimensoes: p.dimensoes } : {}),
    ...(p.estoque ? { estoque: p.estoque } : {}),
    ...(p.atributos?.length ? { atributos: p.atributos } : {}),
  };

  const resp = await blingClient.post('/produtos', body);
  const data = await resp.json();
  if (!resp.ok) {
    throw new Error(`Bling erro ao criar produto: ${JSON.stringify(data)}`);
  }
  return data;
};

export async function createBlingProductsBatch<T extends { idLocal: number; payload: BlingProductFlat }>(
  items: T[],
  { concurrency = 1 }: { concurrency?: number } = {}
) {
  const results: Array<{ idLocal: number; ok: boolean; blingId?: number; error?: string; codigo?: string }> = [];
  let i = 0;

  const worker = async () => {
    while (i < items.length) {
      const idx = i++;
      const { idLocal, payload } = items[idx];
      try {
        const criado = await createBlingProduct(payload);
        const blingId = Number(criado?.data?.id);
        if (!blingId) {
          results[idx] = { idLocal, ok: false, error: 'Bling sem id', codigo: payload.codigo };
        } else {
          results[idx] = { idLocal, ok: true, blingId, codigo: payload.codigo };
        }
      } catch (e: any) {
        results[idx] = { idLocal, ok: false, error: String(e?.message ?? e), codigo: payload.codigo };
      }
    }
  };

  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, () => worker())
  );
  return results;
};
