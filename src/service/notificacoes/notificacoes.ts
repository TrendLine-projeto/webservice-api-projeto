import * as NotificacoesModel from '../../models/notificacoes';
import { NotificacaoBase, PaginacaoParams } from '../../types/notificacoes/notificacoes';

const assertStr = (v: any, nome: string) => {
  if (!v || typeof v !== 'string' || v.trim() === '') {
    throw { tipo: 'Validacao', mensagem: `Campo ${nome} e obrigatorio` };
  }
};

const assertNum = (v: any, nome: string) => {
  const n = Number(v);
  if (!Number.isFinite(n) || n <= 0) {
    throw { tipo: 'Validacao', mensagem: `Campo ${nome} deve ser numerico e maior que zero` };
  }
};

const normalizeDate = (v: any, nome: string, valorPadrao: any = null) => {
  if (v === undefined || v === null || v === '') return valorPadrao;
  const d = new Date(v);
  if (isNaN(d.getTime())) {
    throw { tipo: 'Validacao', mensagem: `Campo ${nome} invalido` };
  }
  return v;
};

const normalizeLido = (v: any, nome: string, valorPadrao: any = undefined) => {
  if (v === undefined || v === null || v === '') return valorPadrao;
  const n = Number(v);
  if (!Number.isFinite(n) || (n !== 0 && n !== 1)) {
    throw { tipo: 'Validacao', mensagem: `Campo ${nome} deve ser 0 ou 1` };
  }
  return n;
};

export const criar = async (n: NotificacaoBase) => {
  assertStr(n.descricao, 'descricao');
  assertStr(n.url, 'url');
  assertStr(n.tipo, 'tipo');
  assertNum(n.idCliente, 'idCliente');

  const dataCriacao = normalizeDate(n.dataCriacao, 'dataCriacao', new Date());
  const lido = normalizeLido(n.lido, 'lido', 0);

  const payload: NotificacaoBase = {
    descricao: n.descricao,
    url: n.url,
    tipo: n.tipo,
    dataCriacao,
    idCliente: Number(n.idCliente),
    lido
  };

  const result = await NotificacoesModel.inserir(payload);
  return { id: result.insertId, ...payload };
};

export const listar = async (p: PaginacaoParams) => {
  normalizeDate(p.dataCriacaoDe, 'dataCriacaoDe');
  normalizeDate(p.dataCriacaoAte, 'dataCriacaoAte');
  const lido = normalizeLido(p.lido, 'lido');
  return NotificacoesModel.listar({ ...p, lido });
};

export const obter = async (id: number) => {
  const item = await NotificacoesModel.buscarPorId(id);
  if (!item) throw { tipo: 'NaoEncontrado', mensagem: 'Notificacao nao encontrada' };
  return item;
};

export const atualizar = async (id: number, n: NotificacaoBase) => {
  assertStr(n.descricao, 'descricao');
  assertStr(n.url, 'url');
  assertStr(n.tipo, 'tipo');
  assertNum(n.idCliente, 'idCliente');

  const existente = await NotificacoesModel.buscarPorId(id);
  if (!existente) throw { tipo: 'NaoEncontrado', mensagem: 'Notificacao nao encontrada' };

  const dataCriacao = normalizeDate(
    n.dataCriacao ?? existente.dataCriacao,
    'dataCriacao',
    existente.dataCriacao ?? new Date()
  );
  const lido = normalizeLido(n.lido, 'lido', existente.lido ?? 0);

  const payload: NotificacaoBase = {
    descricao: n.descricao,
    url: n.url,
    tipo: n.tipo,
    dataCriacao,
    idCliente: Number(n.idCliente),
    lido
  };

  const ok = await NotificacoesModel.atualizar(id, payload);
  if (!ok) throw { tipo: 'NaoEncontrado', mensagem: 'Notificacao nao encontrada' };
  return NotificacoesModel.buscarPorId(id);
};

export const remover = async (id: number) => {
  const ok = await NotificacoesModel.remover(id);
  if (!ok) throw { tipo: 'NaoEncontrado', mensagem: 'Notificacao nao encontrada' };
  return { id, removido: true };
};
