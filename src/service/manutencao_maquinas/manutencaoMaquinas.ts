// src/service/manutencoes/manutencoesBase.ts
import * as ManutencoesModel from '../../models/manutencaoMaquinas';
import * as MaquinasModel from '../../models/maquinas';
import { ManutencaoBase, PaginacaoParams } from '../../types/maquinas/manutencao_maquinas';

const STATUS_DURANTE_MANUTENCAO: string = 'em_manutencao';
const STATUS_MAQUINA_ATIVA = 'ativa';
const STATUS_MANUT_CONCLUIDA = 'concluida';

const assertStr = (v: any, nome: string) => {
  if (!v || typeof v !== 'string' || v.trim() === '') {
    throw { tipo: 'Validacao', mensagem: `Campo ${nome} é obrigatório` };
  }
};

const assertNum = (v: any, nome: string) => {
  if (v === undefined || v === null || v === '') return;
  const n = Number(v);
  if (Number.isNaN(n)) throw { tipo: 'Validacao', mensagem: `Campo ${nome} deve ser numérico` };
};

const isValidDate = (s?: string | null) => {
  if (s === undefined || s === null || s === '') return true;
  const d = new Date(String(s));
  return !isNaN(d.getTime()) && /^\d{4}-\d{2}-\d{2}$/.test(String(s));
};

export const criar = async (m: ManutencaoBase) => {
  if (m.data_execucao && m.proxima_prevista) {
    const de = new Date(m.data_execucao);
    const pp = new Date(m.proxima_prevista);
    if (de.getTime() > pp.getTime()) {
      throw { tipo: 'Validacao', mensagem: 'data_execucao não pode ser maior que proxima_prevista' };
    }
  }

  try {

    const result = await ManutencoesModel.inserir(m);
    await MaquinasModel.atualizarStatusApenas(m.idMaquina, STATUS_DURANTE_MANUTENCAO);
    return { id: result.insertId, ...m };

  } catch (err: any) {
    if (err?.code === 'ER_NO_REFERENCED_ROW_2' || err?.errno === 1452) {
      throw { tipo: 'Validacao', mensagem: `idMaquina inválido: a máquina ${m.idMaquina} não existe` };
    }
    throw err;
  }
};

export const listar = async (p: PaginacaoParams) => {
  return ManutencoesModel.listar(p);
};

export const obter = async (id: number) => {
  const item = await ManutencoesModel.buscarPorId(id);
  if (!item) throw { tipo: 'NaoEncontrado', mensagem: 'Manutenção não encontrada' };
  return item;
};

export const atualizar = async (id: number, m: ManutencaoBase) => {
  assertStr(m.tipo, 'tipo');
  if (!m.idMaquina) throw { tipo: 'Validacao', mensagem: 'idMaquina é obrigatório' };
  if (!await MaquinasModel.buscarPorId(m.idMaquina)) {
    throw { tipo: 'Validacao', mensagem: 'Máquina (idMaquina) não encontrada' };
  }
  if (!isValidDate(m.data_execucao)) {
    throw { tipo: 'Validacao', mensagem: 'data_execucao inválida. Use YYYY-MM-DD' };
  }
  if (!isValidDate(m.proxima_prevista)) {
    throw { tipo: 'Validacao', mensagem: 'proxima_prevista inválida. Use YYYY-MM-DD' };
  }
  assertNum(m.custo, 'custo');

  if (m.data_execucao && m.proxima_prevista) {
    const de = new Date(m.data_execucao);
    const pp = new Date(m.proxima_prevista);
    if (de.getTime() > pp.getTime()) {
      throw { tipo: 'Validacao', mensagem: 'data_execucao não pode ser maior que proxima_prevista' };
    }
  }

  const ok = await ManutencoesModel.atualizar(id, m);
  if (!ok) throw { tipo: 'NaoEncontrado', mensagem: 'Manutenção não encontrada' };
  return ManutencoesModel.buscarPorId(id);
};

export const remover = async (id: number) => {
  const ok = await ManutencoesModel.remover(id);
  if (!ok) throw { tipo: 'NaoEncontrado', mensagem: 'Manutenção não encontrada' };
  return { id, removido: true };
};

export const fechar = async (idManutencao: number) => {
  // 1) busca a manutenção p/ saber o idMaquina
  const manutencao = await ManutencoesModel.buscarPorId(idManutencao);
  if (!manutencao) {
    throw { tipo: 'NaoEncontrado', mensagem: 'Manutenção não encontrada' };
  }

  // 2) marca a manutenção como concluída
  await ManutencoesModel.atualizarStatus(idManutencao, STATUS_MANUT_CONCLUIDA);

  // 3) define a máquina como ativa (ENUM: 'ativa')
  await MaquinasModel.atualizarStatusApenas(manutencao.idMaquina, STATUS_MAQUINA_ATIVA);

  // 4) retorna a manutenção atualizada
  const atualizado = await ManutencoesModel.buscarPorId(idManutencao);
  return {
    id: idManutencao,
    manutencao_status: STATUS_MANUT_CONCLUIDA,
    maquina_id: manutencao.idMaquina,
    maquina_status: STATUS_MAQUINA_ATIVA,
    manutencao: atualizado
  };
};