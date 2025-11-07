// src/service/maquinas/maquinasBase.ts
import * as MaquinasModel from '../../models/maquinas';
import { MaquinaBase, PaginacaoParams, DatasManutencao } from '../../types/maquinas/maquinas';

const assertStr = (v: any, nome: string) => {
  if (!v || typeof v !== 'string' || v.trim() === '') {
    throw { tipo: 'Validacao', mensagem: `Campo ${nome} é obrigatório` };
  }
};

const isValidDateStr = (s?: string | null) => {
  if (s === undefined || s === null) return true; // permitido ausente/nulo (significa não atualizar ou limpar)
  // aceita 'YYYY-MM-DD'
  const d = new Date(s as string);
  return !isNaN(d.getTime()) && /^\d{4}-\d{2}-\d{2}$/.test(String(s));
};

export const criar = async (m: MaquinaBase) => {
  assertStr(m.codigo_interno, 'codigo_interno');
  assertStr(m.nome, 'nome');
  assertStr(m.numero_serie, 'numero_serie');

  if (await MaquinasModel.existeNumeroSerie(m.numero_serie)) {
    throw { tipo: 'Validacao', mensagem: 'numero_serie já cadastrado' };
  }

  const result = await MaquinasModel.inserir(m);
  return { id: result.insertId, ...m };
};

export const obter = async (id: number) => {
  const item = await MaquinasModel.buscarPorId(id);
  if (!item) throw { tipo: 'NaoEncontrado', mensagem: 'Máquina não encontrada' };
  return item;
};

export const atualizar = async (id: number, m: MaquinaBase) => {
  assertStr(m.codigo_interno, 'codigo_interno');
  assertStr(m.nome, 'nome');
  assertStr(m.numero_serie, 'numero_serie');

  if (await MaquinasModel.existeNumeroSerie(m.numero_serie, id)) {
    throw { tipo: 'Validacao', mensagem: 'numero_serie já utilizado em outra máquina' };
  }

  const ok = await MaquinasModel.atualizar(id, m);
  if (!ok) throw { tipo: 'NaoEncontrado', mensagem: 'Máquina não encontrada' };
  return await MaquinasModel.buscarPorId(id);
};

export const remover = async (id: number) => {
  const ok = await MaquinasModel.remover(id);
  if (!ok) throw { tipo: 'NaoEncontrado', mensagem: 'Máquina não encontrada' };
  return { id, removido: true };
};

export const listar = async (p: PaginacaoParams) => {
  return MaquinasModel.listar(p);
};
