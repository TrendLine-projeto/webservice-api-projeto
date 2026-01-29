import * as lotesModel from '../../models/lotes';
import * as notaModel from '../../models/notaFiscal';
import * as produtoModel from '../../models/produtosProducao';
import * as fornecedorModel from '../../models/fornecedorProducao'
import * as notasFiscais from '../../models/notaFiscal';
import * as lotesFechamentoModel from '../../models/lotesFechamento';
import * as conferenciasQualidadeModel from '../../models/conferenciasQualidade';
import * as conferenciaQualidadeDefeitosModel from '../../models/conferenciaQualidadeDefeitos';
import { EntradaDeLote } from '../../types/lotes/EntradaDeLote';
import { LotePut } from '../../types/lotes/AlterarLote';
import { NotaFiscal } from '../../types/notasFiscais/notaFiscal';
import { normalizeProdutoEntrada } from '../../helpers/normalizeProdutoEntrada';
import { inserirProdutosCapturandoIds } from '../../helpers/inserirProdutosCapturandoIds';
import { integrarProdutosNoBling } from '../../helpers/integrarProdutosNoBling';
import { toNum, calcTotal } from '../../shared/num';

const pad2 = (n: number) => String(n).padStart(2, '0');

// Gera "YYYY-MM-DD HH:mm:ss"
const agoraFormatado = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} ` +
    `${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;
};

export const criarLote = async (
  entradaDeLote: EntradaDeLote,
  notaFiscal?: NotaFiscal,
  opts: { integrarNoBling?: boolean; concurrency?: number; integracaoGmailXmlId?: number } = { integrarNoBling: true, concurrency: 3 }
) => {
  const filialExiste = await lotesModel.verificarFilialPorId(entradaDeLote.idFilial);
  if (!filialExiste) {
    throw { tipo: 'FilialNaoEncontrada', mensagem: 'Filial não encontrada. Verifique o ID informado.' };
  }

  const entradaProdutos = Array.isArray(entradaDeLote.produtos) ? entradaDeLote.produtos : [];
  const valorEstimadoCalculado = entradaProdutos.reduce((acc, produto) => {
    const totalInformado = toNum((produto as any)?.someValorTotalProduto);
    if (Number.isFinite(totalInformado)) return acc + (totalInformado as number);
    return acc + calcTotal((produto as any)?.valorPorPeca, (produto as any)?.quantidadeProduto);
  }, 0);

  const entradaDeLoteNormalizada = {
    ...entradaDeLote,
    valorEstimado: entradaProdutos.length ? valorEstimadoCalculado : entradaDeLote.valorEstimado,
    integracaoExterna: Boolean(entradaDeLote.integracaoExterna),
  };

  const { insertId: idLoteCriado } = await lotesModel.inserirLote(entradaDeLoteNormalizada);

  const produtosNormalizados = entradaProdutos.map((p, idx) =>
    normalizeProdutoEntrada(entradaDeLoteNormalizada, p, idx, idLoteCriado)
  );
  const idsLocais = await inserirProdutosCapturandoIds(produtosNormalizados);

  if (notaFiscal) {
    try { await notasFiscais.inserirNotaFiscal(notaFiscal, idLoteCriado, opts.integracaoGmailXmlId); }
    catch (e) { console.error('Erro ao inserir nota fiscal:', e); }
  }

  let resultadosBling: any[] = [];
  if (opts.integrarNoBling && produtosNormalizados.length) {
    try {
      resultadosBling = await integrarProdutosNoBling(produtosNormalizados, idsLocais, { concurrency: opts.concurrency });
    } catch (e) {
      console.error('Falha na integração com Bling:', e);
    }
  }

  return {
    id: idLoteCriado,
    ...entradaDeLoteNormalizada,
    resultadosBling,
  };
};

export const buscarLotesPorCliente = async (filtros: any) => {
  if (!filtros.idFilial) {
    throw { status: 400, mensagem: 'Filial ID é obrigatório.' };
  }

  const resultado = await lotesModel.buscarLotesPorCliente(filtros);

  const loteIds = resultado.lotes.map((l: any) => l.id);
  const fornecedorIds = [...new Set(resultado.lotes.map((l: any) => l.idFornecedor_producao).filter(Boolean))];

  const notasPorLote = await notaModel.buscarNotasPorLoteIds(loteIds);
  const produtosPorLote = await produtoModel.buscarProdutosPorLoteIds(loteIds);
  const fornecedoresPorId = await fornecedorModel.buscarFornecedoresPorIds(fornecedorIds);
  const fechamentosPorLote = await lotesFechamentoModel.buscarPorEntradaLoteIds(loteIds);
  const produtosLista = Object.values(produtosPorLote).flat();
  const produtoIds = produtosLista.map((produto: any) => produto.id);
  const conferenciasPorProduto = await conferenciasQualidadeModel.buscarPorProdutoIds(produtoIds);
  const conferenciaIds = Object.values(conferenciasPorProduto)
    .flat()
    .map((conferencia: any) => conferencia.id);
  const defeitosPorConferencia = await conferenciaQualidadeDefeitosModel.buscarPorConferenciaIds(conferenciaIds);

  const montarProdutos = (loteId: number) => {
    const produtos = produtosPorLote[loteId] || [];
    return produtos.map((produto: any) => {
      const conferencias = conferenciasPorProduto[produto.id] || [];
      const conferenciasComDefeitos = conferencias.map((conferencia: any) => ({
        ...conferencia,
        defeitos: defeitosPorConferencia[conferencia.id] || []
      }));
      return { ...produto, conferencias: conferenciasComDefeitos };
    });
  };

  const lotesComDados = resultado.lotes.map((lote: any) => ({
    ...lote,
    fornecedor: fornecedoresPorId[lote.idFornecedor_producao] || null,
    notasFiscais: notasPorLote[lote.id] || [],
    produtos: montarProdutos(lote.id),
    fechamento: fechamentosPorLote[lote.id] || null
  }));

  return {
    totalRegistros: resultado.totalRegistros,
    lotes: lotesComDados
  };
};

export const encerrarLote = async (idLote: number) => {
  if (!idLote) {
    throw { status: 400, mensagem: 'ID do lote é obrigatório' };
  }

  const produtosEmAberto = await lotesModel.verificarProdutosEmAberto(idLote);

  if (produtosEmAberto.length > 0) {
    throw { status: 400, mensagem: 'Há produtos em aberto ainda para esse lote' };
  }

  await lotesModel.encerrarLote(idLote);
};

export const reabrirLote = async (idLote: number) => {
  if (!idLote) {
    throw { status: 400, mensagem: 'ID do lote é obrigatório' };
  }

  await lotesModel.reabrirLote(idLote);
};

export const buscarLotePorId = async (idLote: number) => {
  if (isNaN(idLote)) {
    throw { status: 400, mensagem: 'ID do lote inválido' };
  }

  const lote = await lotesModel.buscarLotePorId(idLote);

  if (!lote) {
    throw { status: 404, mensagem: 'Lote não encontrado' };
  }

  // Buscar dados relacionados
  const [notas, produtos, fornecedor] = await Promise.all([
    notaModel.buscarNotasPorLoteIds([lote.id]),
    produtoModel.buscarProdutosPorLoteIds([lote.id]),
    fornecedorModel.buscarFornecedoresPorIds([lote.idFornecedor_producao])
  ]);
  const fechamento = await lotesFechamentoModel.buscarPorEntradaLoteId(lote.id);
  const produtosDoLote = produtos[lote.id] || [];
  const produtoIds = produtosDoLote.map((produto: any) => produto.id);
  const conferenciasPorProduto = await conferenciasQualidadeModel.buscarPorProdutoIds(produtoIds);
  const conferenciaIds = Object.values(conferenciasPorProduto)
    .flat()
    .map((conferencia: any) => conferencia.id);
  const defeitosPorConferencia = await conferenciaQualidadeDefeitosModel.buscarPorConferenciaIds(conferenciaIds);
  const produtosComConferencias = produtosDoLote.map((produto: any) => {
    const conferencias = conferenciasPorProduto[produto.id] || [];
    const conferenciasComDefeitos = conferencias.map((conferencia: any) => ({
      ...conferencia,
      defeitos: defeitosPorConferencia[conferencia.id] || []
    }));
    return { ...produto, conferencias: conferenciasComDefeitos };
  });

  return {
    ...lote,
    notasFiscais: notas[lote.id] || [],
    produtos: produtosComConferencias,
    fornecedor: fornecedor[lote.idFornecedor_producao] || null,
    fechamento
  };
};

export const iniciarLote = async (idLote: number) => {
  if (!idLote) throw { status: 400, mensagem: 'ID do lote é obrigatório' };

  const dataInicio = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const fmt = `${dataInicio.getFullYear()}-${pad(dataInicio.getMonth() + 1)}-${pad(dataInicio.getDate())} ${pad(dataInicio.getHours())}:${pad(dataInicio.getMinutes())}:${pad(dataInicio.getSeconds())}`;

  const { lotesAfetados, produtosAfetados } = await lotesModel.iniciarLote(idLote, fmt);

  if (lotesAfetados === 0) throw { status: 404, mensagem: 'Lote não encontrado' };

  return { idEntrada_lotes: idLote, dataEntrada: fmt, lotesAfetados, produtosAfetados };
};

export const atualizarLoteCompleto = async (id: number, body: Partial<LotePut>) => {
  if (!id) throw { status: 400, mensagem: 'ID do lote é obrigatório' };
  if (!body || typeof body !== 'object') throw { status: 400, mensagem: 'Corpo inválido' };

  // Cast numérico simples (se vier string numérica)
  const valorEstimado =
    body.valorEstimado === null ? null : Number(body.valorEstimado);
  const valorHoraEstimado =
    body.valorHoraEstimado === null ? null : Number(body.valorHoraEstimado);

  if (body.valorEstimado !== null && Number.isNaN(valorEstimado)) {
    throw { status: 400, mensagem: 'valorEstimado deve ser numérico' };
  }
  if (body.valorHoraEstimado !== null && Number.isNaN(valorHoraEstimado)) {
    throw { status: 400, mensagem: 'valorHoraEstimado deve ser numérico' };
  }

  const { affectedRows } = await lotesModel.atualizarLoteCompleto(
    id,
    body.numeroIdentificador ?? null,
    body.nomeEntregador ?? null,
    body.nomeRecebedor ?? null,
    valorEstimado,
    valorHoraEstimado,
    body.dataEntrada ?? null,
    body.dataPrevistaSaida ?? null,
    body.dataInicio ?? null,
    body.dataSaida ?? null
  );

  if (affectedRows === 0) throw { status: 404, mensagem: 'Lote não encontrado' };

  return { idEntrada_lotes: id, registrosAfetados: affectedRows };
};

export const deletarLoteComProdutos = async (idLote: number) => {
  if (isNaN(idLote)) {
    throw { status: 400, mensagem: 'ID do lote inválido' };
  }

  const lote = await lotesModel.buscarLotePorId(idLote);
  if (!lote) {
    throw { status: 404, mensagem: 'Lote não encontrado' };
  }

  if (!lote.loteFinalizado) {
    throw { status: 400, mensagem: 'Lote não finalizado, não pode ser excluído' };
  }

  const produtosNaoFinalizados = await lotesModel.verificarProdutosNaoFinalizados(idLote);
  if (produtosNaoFinalizados.length > 0) {
    throw { status: 400, mensagem: 'Existem produtos não finalizados neste lote' };
  }

  await lotesModel.deletarProdutosDoLote(idLote);
  await lotesModel.deletarLotePorId(idLote);
};
