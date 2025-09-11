// src/integration/bling/produtos/bling-product.dto.ts
import { ProdutoProducao } from "../../../types/ProdutoProducao/ProdutoProducao";
import { BlingProductFlat } from "../types/bling.types";

export function mapProdutoToBlingPayload(
  entradaProduto: ProdutoProducao,
  produtoLocalId: number
): BlingProductFlat {
  // Bloco DIMENSÕES (só envia se houver ao menos 1 campo)
  const dimensoes =
    entradaProduto.largura != null ||
    entradaProduto.altura != null ||
    entradaProduto.profundidade != null
      ? {
          dimensoes: {
            ...(entradaProduto.largura != null ? { largura: Number(entradaProduto.largura) } : {}),
            ...(entradaProduto.altura != null ? { altura: Number(entradaProduto.altura) } : {}),
            ...(entradaProduto.profundidade != null ? { profundidade: Number(entradaProduto.profundidade) } : {}),
            unidadeMedida: "Centímetros",
          },
        }
      : {};

  // Bloco ESTOQUE (só envia se houver ao menos 1 campo)
  const estoque =
    entradaProduto.estoqueMinimo != null ||
    entradaProduto.estoqueMaximo != null ||
    entradaProduto.estoqueCrossdocking != null ||
    entradaProduto.estoqueLocalizacao
      ? {
          estoque: {
            ...(entradaProduto.estoqueMinimo != null ? { minimo: Number(entradaProduto.estoqueMinimo) } : {}),
            ...(entradaProduto.estoqueMaximo != null ? { maximo: Number(entradaProduto.estoqueMaximo) } : {}),
            ...(entradaProduto.estoqueCrossdocking != null ? { crossdocking: Number(entradaProduto.estoqueCrossdocking) } : {}),
            ...(entradaProduto.estoqueLocalizacao ? { localizacao: entradaProduto.estoqueLocalizacao } : {}),
          },
        }
      : {};

  // Campos simples opcionais (características)
  const caracteristicas = {
    ...(entradaProduto.marca ? { marca: entradaProduto.marca } : {}),
    ...(entradaProduto.pesoLiquido != null ? { pesoLiquido: Number(entradaProduto.pesoLiquido) } : {}),
    ...(entradaProduto.pesoBruto != null ? { pesoBruto: Number(entradaProduto.pesoBruto) } : {}),
    ...(entradaProduto.volumes != null ? { volumes: Number(entradaProduto.volumes) } : {}),
    ...(entradaProduto.itensPorCaixa != null ? { itensPorCaixa: Number(entradaProduto.itensPorCaixa) } : {}),
    ...(entradaProduto.descricaoCurta ? { descricaoCurta: entradaProduto.descricaoCurta } : {}),
  };

  // Core obrigatório
  const core: BlingProductFlat = {
    nome: entradaProduto.nomeProduto,
    codigo: entradaProduto.numeroIdentificador ?? String(produtoLocalId),
    preco: Number(entradaProduto.valorPorPeca ?? 0),
    unidade: "UN",
    tipo: "P",
    formato: "S",
    situacao: "A",
  };

  // Junta tudo que existir
  return {
    ...core,
    ...caracteristicas,
    ...dimensoes,
    ...estoque,
  };
};
