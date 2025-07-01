import * as lotesModel from '../../models/lotes';
import { EntradaDeLote } from '../../types/lotes/EntradaDeLote';
import { NotaFiscal } from '../../types/notasFiscais/notaFiscal';
import * as notasFiscais from '../../models/notaFiscal';

export const criarLote = async (
  entradaDeLote: EntradaDeLote,
  notaFiscal?: NotaFiscal
) => {
  const filialExiste = await lotesModel.verificarFilialPorId(entradaDeLote.idFilial);

  if (!filialExiste) {
    throw {
      tipo: 'FilialNaoEncontrada',
      mensagem: 'Filial não encontrada. Verifique o ID informado.'
    };
  }

  const resultadoLote = await lotesModel.inserirLote(entradaDeLote);
  const idLoteCriado = resultadoLote.insertId;

  if (entradaDeLote.produtos && entradaDeLote.produtos.length > 0) {
    await lotesModel.inserirProdutosNoLote(idLoteCriado, entradaDeLote.produtos);
  }

  if (notaFiscal) {
    try {
      await notasFiscais.inserirNotaFiscal(notaFiscal, idLoteCriado);
    } catch (erroNota) {
      console.error("Erro ao inserir nota fiscal:", erroNota);
    }
  } else {
    console.warn("Nenhuma nota fiscal fornecida para este lote.");
  }

  return {
    id: idLoteCriado,
    ...entradaDeLote
  };
};

export const buscarLotesPorCliente = async (filtros: any) => {
  if (!filtros.idFilial) {
    throw { status: 400, mensagem: 'Filial ID é obrigatório.' };
  }

  return await lotesModel.buscarLotesPorCliente(filtros);
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

  return lote;
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

