// src/service/manutencoes/manutencoesBase.ts
import * as ManutencoesModel from '../../models/manutencaoMaquinas';
import * as MaquinasModel from '../../models/maquinas';
import * as OrdensServicoService from '../ordens_servico/ordensServico';
import * as NotificacoesService from '../notificacoes/notificacoes';
import { OrdemServicoBase } from '../../types/ordensServico/ordensServico';
import { ManutencaoBase, PaginacaoParams } from '../../types/maquinas/manutencao_maquinas';

const STATUS_DURANTE_MANUTENCAO: string = 'em_manutencao';
const STATUS_MAQUINA_ATIVA = 'ativa';
const STATUS_MANUT_CONCLUIDA = 'concluida';

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

const isValidDate = (s?: string | null) => {
  if (s === undefined || s === null || s === '') return true;
  const d = new Date(String(s));
  return !isNaN(d.getTime()) && /^\d{4}-\d{2}-\d{2}$/.test(String(s));
};

const criarNotificacaoManutencao = async (
  acao: 'Criacao' | 'Edicao' | 'Alteracao',
  payload: { idCliente?: number; nomeMaquina?: string; idMaquina?: number },
  idManutencao?: number
) => {
  if (!payload?.idCliente) return;
  const alvo = payload.nomeMaquina
    || (payload.idMaquina ? `maquina ${payload.idMaquina}` : (idManutencao ? `manutencao ${idManutencao}` : 'manutencao'));
  await NotificacoesService.criar({
    descricao: `${acao} de manutencao: ${alvo}`,
    url: '/ativos/planomanutencao',
    tipo: acao,
    idCliente: Number(payload.idCliente)
  });
};

export const criar = async (m: ManutencaoBase) => {
  assertNum(m.idCliente, 'idCliente');
  const maquina = await MaquinasModel.buscarPorId(m.idMaquina);
  if (!maquina) {
    throw { tipo: 'Validacao', mensagem: `Maquina ${m.idMaquina} nao encontrada` };
  }
  const idClienteMaquina = Number(maquina.idCliente ?? m.idCliente);
  if (!Number.isFinite(idClienteMaquina) || idClienteMaquina <= 0) {
    throw { tipo: 'Validacao', mensagem: 'idCliente da maquina nao encontrado ou invalido' };
  }

  if (m.data_execucao && m.proxima_prevista) {
    const de = new Date(m.data_execucao);
    const pp = new Date(m.proxima_prevista);
    if (de.getTime() > pp.getTime()) {
      throw { tipo: 'Validacao', mensagem: 'data_execucao nao pode ser maior que proxima_prevista' };
    }
  }

  try {
    const result = await ManutencoesModel.inserir({ ...m, idCliente: idClienteMaquina });
    await MaquinasModel.atualizarStatusApenas(m.idMaquina, STATUS_DURANTE_MANUTENCAO);

    try {
      await criarOrdemServicoAutomatico(maquina.nome ?? '', idClienteMaquina);
      await criarNotificacaoManutencao('Criacao', {
        idCliente: idClienteMaquina,
        nomeMaquina: maquina.nome ?? undefined,
        idMaquina: m.idMaquina
      }, result.insertId);
    } catch (ordemErr) {
      // tenta desfazer a manutencao para nao deixar inconsistente
      await ManutencoesModel.remover(result.insertId).catch(() => {});
      throw ordemErr;
    }

    return { id: result.insertId, ...m, idCliente: idClienteMaquina };
  } catch (err: any) {
    if (err?.code === 'ER_NO_REFERENCED_ROW_2' || err?.errno === 1452) {
      throw { tipo: 'Validacao', mensagem: `idMaquina invalido: a maquina ${m.idMaquina} nao existe` };
    }
    throw err;
  }
};

export const listar = async (p: PaginacaoParams) => {
  return ManutencoesModel.listar(p);
};

export const obter = async (id: number) => {
  const item = await ManutencoesModel.buscarPorId(id);
  if (!item) throw { tipo: 'NaoEncontrado', mensagem: 'Manutencao nao encontrada' };
  return item;
};

export const atualizar = async (id: number, m: ManutencaoBase) => {
  assertStr(m.tipo, 'tipo');
  assertNum(m.idCliente, 'idCliente');
  if (!m.idMaquina) throw { tipo: 'Validacao', mensagem: 'idMaquina e obrigatorio' };
  const maquina = await MaquinasModel.buscarPorId(m.idMaquina);
  if (!maquina) {
    throw { tipo: 'Validacao', mensagem: 'Maquina (idMaquina) nao encontrada' };
  }
  if (!isValidDate(m.data_execucao)) {
    throw { tipo: 'Validacao', mensagem: 'data_execucao invalida. Use YYYY-MM-DD' };
  }
  if (!isValidDate(m.proxima_prevista)) {
    throw { tipo: 'Validacao', mensagem: 'proxima_prevista invalida. Use YYYY-MM-DD' };
  }
  assertNum(m.custo, 'custo');

  if (m.data_execucao && m.proxima_prevista) {
    const de = new Date(m.data_execucao);
    const pp = new Date(m.proxima_prevista);
    if (de.getTime() > pp.getTime()) {
      throw { tipo: 'Validacao', mensagem: 'data_execucao nao pode ser maior que proxima_prevista' };
    }
  }

  const ok = await ManutencoesModel.atualizar(id, m);
  if (!ok) throw { tipo: 'NaoEncontrado', mensagem: 'Manutencao nao encontrada' };
  await criarNotificacaoManutencao('Edicao', {
    idCliente: m.idCliente,
    nomeMaquina: maquina.nome ?? undefined,
    idMaquina: m.idMaquina
  }, id);
  return ManutencoesModel.buscarPorId(id);
};

export const remover = async (id: number) => {
  const existente = await ManutencoesModel.buscarPorId(id);
  if (!existente) throw { tipo: 'NaoEncontrado', mensagem: 'Manutencao nao encontrada' };
  const ok = await ManutencoesModel.remover(id);
  if (!ok) throw { tipo: 'NaoEncontrado', mensagem: 'Manutencao nao encontrada' };
  await criarNotificacaoManutencao('Alteracao', {
    idCliente: existente.idCliente,
    idMaquina: existente.idMaquina
  }, id);
  return { id, removido: true };
};

export const fechar = async (idManutencao: number) => {
  // 1) busca a manutencao p/ saber o idMaquina
  const manutencao = await ManutencoesModel.buscarPorId(idManutencao);
  if (!manutencao) {
    throw { tipo: 'NaoEncontrado', mensagem: 'Manutencao nao encontrada' };
  }

  // 2) marca a manutencao como concluida
  await ManutencoesModel.atualizarStatus(idManutencao, STATUS_MANUT_CONCLUIDA);

  // 3) define a maquina como ativa (ENUM: 'ativa')
  await MaquinasModel.atualizarStatusApenas(manutencao.idMaquina, STATUS_MAQUINA_ATIVA);

  await criarNotificacaoManutencao('Alteracao', {
    idCliente: manutencao.idCliente,
    idMaquina: manutencao.idMaquina
  }, idManutencao);

  // 4) retorna a manutencao atualizada
  const atualizado = await ManutencoesModel.buscarPorId(idManutencao);
  return {
    id: idManutencao,
    manutencao_status: STATUS_MANUT_CONCLUIDA,
    maquina_id: manutencao.idMaquina,
    maquina_status: STATUS_MAQUINA_ATIVA,
    manutencao: atualizado
  };
};

const gerarNumeroOrdemUnico = async (): Promise<string> => {
  let tentativas = 0;
  while (tentativas < 20) {
    const numero = `OS-${Date.now().toString(36)}-${Math.floor(Math.random() * 10000)}`;
    const existente = await OrdensServicoService.buscarPorNumero(numero);
    if (!existente) return numero;
    tentativas += 1;
  }
  throw { tipo: 'Validacao', mensagem: 'Nao foi possivel gerar numeroOrdem unico' };
};

const criarOrdemServicoAutomatico = async (nomeMaquina: string, idCliente: number) => {
  const numeroOrdem = await gerarNumeroOrdemUnico();
  const hojeIso = new Date().toISOString().slice(0, 10);
  const ordemPayload: OrdemServicoBase = {
    descricao: `Manutencao para o ativo ${nomeMaquina} criado no dia ${hojeIso}`,
    descricaoAtivo: nomeMaquina || null,
    numeroOrdem,
    dataAbertura: hojeIso,
    ordemManual: 1,
    idCliente,
    finalizado: 0,
    dataFinalizado: null,
    descricaoFinalizado: null,
  };
  await OrdensServicoService.criar(ordemPayload);
  return ordemPayload;
};

const criarNotificacaoAutomatico = async (nomeMaquina: string, idCliente: number, idManutencao: number) => {
  const tituloMaquina = nomeMaquina || `maquina ${idManutencao}`;
  return NotificacoesService.criar({
    descricao: `Nova ManutenÇõÇœo criada para ${tituloMaquina}`,
    url: `/manutencoes/${idManutencao}`,
    tipo: 'ManutenÇõÇœo',
    dataCriacao: new Date(),
    idCliente,
  });
};



