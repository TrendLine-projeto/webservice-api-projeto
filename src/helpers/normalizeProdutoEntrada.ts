// src/services/lotes/helpers/normalizeProdutoEntrada.ts
import { toNum, toIntBool, calcTotal } from '../shared/num';
import { ProdutoProducao } from '../types/ProdutoProducao/ProdutoProducao';
import { EntradaDeLote } from '../types/lotes/EntradaDeLote'; // <-- ajuste o path conforme seu projeto

export function normalizeProdutoEntrada(
  entradaDeLote: EntradaDeLote,
  p: any,
  idx: number,
  idLoteCriado: number
): ProdutoProducao {
  const numeroIdentificador =
    p?.numeroIdentificador ??
    (entradaDeLote.numeroIdentificador
      ? `${entradaDeLote.numeroIdentificador}-${idx + 1}`
      : `LOTE-${idLoteCriado}-${idx + 1}`);

  return {
    ...p,
    idEntrada_lotes: idLoteCriado,
    iniciado: toIntBool(entradaDeLote.loteIniciado),

    // numéricos vindos como string → número
    valorPorPeca: toNum(p?.valorPorPeca) ?? 0,
    quantidadeProduto: toNum(p?.quantidadeProduto) ?? 0,
    someValorTotalProduto: calcTotal(p?.valorPorPeca, p?.quantidadeProduto),

    pesoLiquido: toNum(p?.pesoLiquido),
    pesoBruto: toNum(p?.pesoBruto),
    volumes: toNum(p?.volumes),
    itensPorCaixa: toNum(p?.itensPorCaixa),

    largura: toNum(p?.largura),
    altura: toNum(p?.altura),
    profundidade: toNum(p?.profundidade),

    estoqueMinimo: toNum(p?.estoqueMinimo),
    estoqueMaximo: toNum(p?.estoqueMaximo),
    estoqueCrossdocking: toNum(p?.estoqueCrossdocking),

    // localização: evita mandar 0
    estoqueLocalizacao:
      p?.estoqueLocalizacao && String(p?.estoqueLocalizacao) !== '0'
        ? String(p?.estoqueLocalizacao)
        : '',

    numeroIdentificador,
  } as ProdutoProducao;
}