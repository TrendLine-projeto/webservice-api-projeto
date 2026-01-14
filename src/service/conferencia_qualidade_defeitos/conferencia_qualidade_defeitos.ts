import * as ConferenciaQualidadeDefeitosModel from '../../models/conferenciaQualidadeDefeitos';
import {
  ConferenciaQualidadeDefeitoBase,
  ConferenciaQualidadeDefeitoFiltro
} from '../../types/qualidade/ConferenciaQualidadeDefeito';

const normalizeId = (v: any, nome: string) => {
  if (v === undefined || v === null || v === '') {
    throw { tipo: 'Validacao', mensagem: `Campo ${nome} e obrigatorio` };
  }
  const n = Number(v);
  if (!Number.isInteger(n) || n <= 0) {
    throw { tipo: 'Validacao', mensagem: `Campo ${nome} deve ser um inteiro positivo` };
  }
  return n;
};

const normalizeInt = (v: any, nome: string, allowNull = false) => {
  if (v === undefined || v === '') {
    return null;
  }
  if (v === null) {
    if (allowNull) return null;
    throw { tipo: 'Validacao', mensagem: `Campo ${nome} e obrigatorio` };
  }
  const n = Number(v);
  if (!Number.isFinite(n) || !Number.isInteger(n) || n < 0) {
    throw { tipo: 'Validacao', mensagem: `Campo ${nome} deve ser um inteiro maior ou igual a zero` };
  }
  return n;
};

export const criar = async (payload: ConferenciaQualidadeDefeitoBase) => {
  const id = normalizeId(payload.id, 'id');
  const idConferenciaQualidade = normalizeId(payload.idConferenciaQualidade, 'idConferenciaQualidade');

  const existeConferencia = await ConferenciaQualidadeDefeitosModel.verificarConferenciaQualidadePorId(
    idConferenciaQualidade
  );
  if (!existeConferencia) {
    throw { tipo: 'ConferenciaNaoEncontrada', mensagem: 'Conferencia de qualidade nao encontrada.' };
  }

  const quantidade = normalizeInt(payload.quantidade, 'quantidade', true);

  const data: ConferenciaQualidadeDefeitoBase = {
    id,
    idConferenciaQualidade,
    tipoDefeito: payload.tipoDefeito ?? null,
    quantidade,
    observacao: payload.observacao ?? null
  };

  await ConferenciaQualidadeDefeitosModel.inserir(data);
  return data;
};

export const listar = async (filtros: ConferenciaQualidadeDefeitoFiltro) => {
  const query: ConferenciaQualidadeDefeitoFiltro = { ...filtros };

  if (query.idConferenciaQualidade !== undefined && query.idConferenciaQualidade !== null && query.idConferenciaQualidade !== '') {
    query.idConferenciaQualidade = normalizeId(query.idConferenciaQualidade, 'idConferenciaQualidade');
  }

  if (query.quantidade !== undefined && query.quantidade !== null && query.quantidade !== '') {
    query.quantidade = normalizeInt(query.quantidade, 'quantidade', true) as any;
  }

  return ConferenciaQualidadeDefeitosModel.listar(query);
};

export const obter = async (id: number) => {
  const item = await ConferenciaQualidadeDefeitosModel.buscarPorId(id);
  if (!item) throw { tipo: 'NaoEncontrado', mensagem: 'Defeito nao encontrado' };
  return item;
};

export const atualizar = async (id: number, dados: ConferenciaQualidadeDefeitoBase) => {
  const existente = await ConferenciaQualidadeDefeitosModel.buscarPorId(id);
  if (!existente) throw { tipo: 'NaoEncontrado', mensagem: 'Defeito nao encontrado' };

  const idConferenciaQualidade = dados.idConferenciaQualidade !== undefined
    ? normalizeId(dados.idConferenciaQualidade, 'idConferenciaQualidade')
    : existente.idConferenciaQualidade;

  if (idConferenciaQualidade !== existente.idConferenciaQualidade) {
    if (idConferenciaQualidade === null || idConferenciaQualidade === undefined) {
      throw { tipo: 'Validacao', mensagem: 'Campo idConferenciaQualidade e obrigatorio' };
    }
    const existeConferencia = await ConferenciaQualidadeDefeitosModel.verificarConferenciaQualidadePorId(
      idConferenciaQualidade
    );
    if (!existeConferencia) {
      throw { tipo: 'ConferenciaNaoEncontrada', mensagem: 'Conferencia de qualidade nao encontrada.' };
    }
  }

  const quantidade = dados.quantidade !== undefined
    ? normalizeInt(dados.quantidade, 'quantidade', true)
    : existente.quantidade;

  const payload: ConferenciaQualidadeDefeitoBase = {
    idConferenciaQualidade,
    tipoDefeito: dados.tipoDefeito !== undefined ? (dados.tipoDefeito ?? null) : existente.tipoDefeito,
    quantidade,
    observacao: dados.observacao !== undefined ? (dados.observacao ?? null) : existente.observacao
  };

  const ok = await ConferenciaQualidadeDefeitosModel.atualizar(id, payload);
  if (!ok) throw { tipo: 'NaoEncontrado', mensagem: 'Defeito nao encontrado' };
  return ConferenciaQualidadeDefeitosModel.buscarPorId(id);
};

export const remover = async (id: number) => {
  const ok = await ConferenciaQualidadeDefeitosModel.remover(id);
  if (!ok) throw { tipo: 'NaoEncontrado', mensagem: 'Defeito nao encontrado' };
  return { id, removido: true };
};
