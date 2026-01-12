import * as OrdensServicoModel from '../../models/ordensServico';
import * as NotificacoesService from '../notificacoes/notificacoes';
import { OrdemServicoBase, PaginacaoParams } from '../../types/ordensServico/ordensServico';

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

const assertFlag = (v: any, nome: string, valorPadrao = 0) => {
  if (v === undefined || v === null || v === '') return valorPadrao;
  const n = Number(v);
  if (n !== 0 && n !== 1) {
    throw { tipo: 'Validacao', mensagem: `Campo ${nome} deve ser 0 ou 1` };
  }
  return n;
};

const normalizeDate = (v: any, nome: string) => {
  if (v === undefined || v === null || v === '') return null;
  const d = new Date(v);
  if (isNaN(d.getTime())) {
    throw { tipo: 'Validacao', mensagem: `Campo ${nome} invalido` };
  }
  return v;
};

const criarNotificacaoOrdemServico = async (
  acao: 'Criacao' | 'Edicao' | 'Alteracao',
  payload: { idCliente?: number; numeroOrdem?: string },
  idOrdem?: number
) => {
  if (!payload?.idCliente) return;
  const identificador = payload.numeroOrdem || (idOrdem ? `ordem ${idOrdem}` : 'ordem');
  await NotificacoesService.criar({
    descricao: `${acao} de ordem de servico: ${identificador}`,
    url: '/ativos/os',
    tipo: acao,
    idCliente: Number(payload.idCliente)
  });
};

export const criar = async (o: OrdemServicoBase) => {
  assertStr(o.descricao, 'descricao');
  assertStr(o.numeroOrdem, 'numeroOrdem');
  assertNum(o.idCliente, 'idCliente');

  const ordemManual = assertFlag(o.ordemManual, 'ordemManual', 0);
  const finalizado = assertFlag(o.finalizado, 'finalizado', 0);
  const dataAbertura = normalizeDate(o.dataAbertura, 'dataAbertura') as any;
  const dataFinalizado = normalizeDate(o.dataFinalizado, 'dataFinalizado') as any;

  const payload: OrdemServicoBase = {
    descricao: o.descricao,
    descricaoAtivo: o.descricaoAtivo ?? null,
    numeroOrdem: o.numeroOrdem,
    dataAbertura,
    ordemManual,
    finalizado,
    dataFinalizado,
    descricaoFinalizado: o.descricaoFinalizado ?? null,
    idCliente: Number(o.idCliente)
  };

  const result = await OrdensServicoModel.inserir(payload);
  await criarNotificacaoOrdemServico('Criacao', {
    idCliente: payload.idCliente,
    numeroOrdem: payload.numeroOrdem
  }, result.insertId);
  return { id: result.insertId, ...payload };
};

export const listar = async (p: PaginacaoParams) => {
  normalizeDate(p.dataAberturaDe, 'dataAberturaDe');
  normalizeDate(p.dataAberturaAte, 'dataAberturaAte');
  return OrdensServicoModel.listar(p);
};

export const obter = async (id: number) => {
  const item = await OrdensServicoModel.buscarPorId(id);
  if (!item) throw { tipo: 'NaoEncontrado', mensagem: 'Ordem de servico nao encontrada' };
  return item;
};

export const buscarPorNumero = async (numeroOrdem: string) => {
  return OrdensServicoModel.buscarPorNumero(numeroOrdem);
};

export const atualizar = async (id: number, o: OrdemServicoBase) => {
  assertStr(o.descricao, 'descricao');
  assertStr(o.numeroOrdem, 'numeroOrdem');
  assertNum(o.idCliente, 'idCliente');

  const ordemManual = assertFlag(o.ordemManual, 'ordemManual', 0);
  const finalizado = assertFlag(o.finalizado, 'finalizado', 0);
  const dataAbertura = normalizeDate(o.dataAbertura, 'dataAbertura') as any;
  const dataFinalizado = normalizeDate(o.dataFinalizado, 'dataFinalizado') as any;

  const payload: OrdemServicoBase = {
    descricao: o.descricao,
    descricaoAtivo: o.descricaoAtivo ?? null,
    numeroOrdem: o.numeroOrdem,
    dataAbertura,
    ordemManual,
    finalizado,
    dataFinalizado,
    descricaoFinalizado: o.descricaoFinalizado ?? null,
    idCliente: Number(o.idCliente)
  };

  const ok = await OrdensServicoModel.atualizar(id, payload);
  if (!ok) throw { tipo: 'NaoEncontrado', mensagem: 'Ordem de servico nao encontrada' };
  await criarNotificacaoOrdemServico('Edicao', {
    idCliente: payload.idCliente,
    numeroOrdem: payload.numeroOrdem
  }, id);
  return OrdensServicoModel.buscarPorId(id);
};

export const remover = async (id: number) => {
  const existente = await OrdensServicoModel.buscarPorId(id);
  if (!existente) throw { tipo: 'NaoEncontrado', mensagem: 'Ordem de servico nao encontrada' };
  const ok = await OrdensServicoModel.remover(id);
  if (!ok) throw { tipo: 'NaoEncontrado', mensagem: 'Ordem de servico nao encontrada' };
  await criarNotificacaoOrdemServico('Alteracao', {
    idCliente: existente.idCliente,
    numeroOrdem: existente.numeroOrdem
  }, id);
  return { id, removido: true };
};

export const finalizar = async (
  id: number,
  dados: { finalizado?: number; descricaoFinalizado: string; dataFinalizado?: string | null; }
) => {
  const existente = await OrdensServicoModel.buscarPorId(id);
  if (!existente) throw { tipo: 'NaoEncontrado', mensagem: 'Ordem de servico nao encontrada' };
  const finalizado = assertFlag(dados.finalizado ?? 1, 'finalizado', 1);
  assertStr(dados.descricaoFinalizado, 'descricaoFinalizado');
  const dataFinalizado = normalizeDate(dados.dataFinalizado ?? new Date(), 'dataFinalizado');

  const ok = await OrdensServicoModel.finalizar(
    id,
    finalizado,
    dados.descricaoFinalizado,
    dataFinalizado
  );

  if (!ok) throw { tipo: 'NaoEncontrado', mensagem: 'Ordem de servico nao encontrada' };
  await criarNotificacaoOrdemServico('Alteracao', {
    idCliente: existente.idCliente,
    numeroOrdem: existente.numeroOrdem
  }, id);
  return OrdensServicoModel.buscarPorId(id);
};
