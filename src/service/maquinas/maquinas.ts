// src/service/maquinas/maquinasBase.ts
import * as MaquinasModel from '../../models/maquinas';
import * as NotificacoesService from '../notificacoes/notificacoes';
import { MaquinaBase, PaginacaoParams } from '../../types/maquinas/maquinas';

const criarNotificacaoMaquina = async (
  acao: 'Criacao' | 'Edicao' | 'Alteracao',
  payload: { idCliente?: number; nome?: string; codigo_interno?: string },
  idMaquina?: number
) => {
  if (!payload?.idCliente) return;
  const nome = payload.nome || payload.codigo_interno || (idMaquina ? `maquina ${idMaquina}` : 'maquina');
  await NotificacoesService.criar({
    descricao: `${acao} de maquina: ${nome}`,
    url: '/ativos/maquinas',
    tipo: acao,
    idCliente: Number(payload.idCliente)
  });
};

const assertStr = (v: any, nome: string) => {
  if (!v || typeof v !== 'string' || v.trim() === '') {
    throw { tipo: 'Validacao', mensagem: `Campo ${nome} são obrigatórias` };
  }
};

const assertNum = (v: any, nome: string) => {
  const n = Number(v);
  if (!Number.isFinite(n) || n <= 0) {
    throw { tipo: 'Validacao', mensagem: `Campo ${nome} deve ser numÃ©rico e maior que zero` };
  }
};

export const criar = async (m: MaquinaBase) => {
  assertNum(m.idCliente, 'idCliente');
  assertStr(m.codigo_interno, 'codigo_interno');
  assertStr(m.nome, 'nome');
  assertStr(m.numero_serie, 'numero_serie');

  if (await MaquinasModel.existeNumeroSerie(m.numero_serie)) {
    throw { tipo: 'Validacao', mensagem: 'numero_serie jÃ¡ cadastrado' };
  }

  const result = await MaquinasModel.inserir(m);
  await criarNotificacaoMaquina('Criacao', {
    idCliente: m.idCliente,
    nome: m.nome,
    codigo_interno: m.codigo_interno
  }, result.insertId);
  return { id: result.insertId, ...m };
};

export const obter = async (id: number) => {
  const item = await MaquinasModel.buscarPorId(id);
  if (!item) throw { tipo: 'NaoEncontrado', mensagem: 'Maquina não encontrada' };
  return item;
};

export const atualizar = async (id: number, m: MaquinaBase) => {
  assertNum(m.idCliente, 'idCliente');
  assertStr(m.codigo_interno, 'codigo_interno');
  assertStr(m.nome, 'nome');
  assertStr(m.numero_serie, 'numero_serie');

  if (await MaquinasModel.existeNumeroSerie(m.numero_serie, id)) {
    throw { tipo: 'Validacao', mensagem: 'numero_serie já utilizado em outra maquina' };
  }

  const ok = await MaquinasModel.atualizar(id, m);
  if (!ok) throw { tipo: 'NaoEncontrado', mensagem: 'Máquina não encontrada' };
  await criarNotificacaoMaquina('Edicao', {
    idCliente: m.idCliente,
    nome: m.nome,
    codigo_interno: m.codigo_interno
  }, id);
  return await MaquinasModel.buscarPorId(id);
};

export const remover = async (id: number) => {
  const existente = await MaquinasModel.buscarPorId(id);
  const ok = await MaquinasModel.remover(id);
  if (!ok) throw { tipo: 'NaoEncontrado', mensagem: 'Máquina não encontrada' };
  if (existente) {
    await criarNotificacaoMaquina('Alteracao', {
      idCliente: existente.idCliente,
      nome: existente.nome,
      codigo_interno: existente.codigo_interno
    }, id);
  }
  return { id, removido: true };
};

export const listar = async (p: PaginacaoParams) => {
  return MaquinasModel.listar(p);
};


