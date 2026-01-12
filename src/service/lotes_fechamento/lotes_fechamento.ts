import * as LotesFechamentoModel from '../../models/lotesFechamento';
import * as LotesModel from '../../models/lotes';
import * as NotificacoesService from '../notificacoes/notificacoes';
import {
  LoteFechamentoBase,
  LoteFechamentoFiltro
} from '../../types/lotes/LoteFechamento';

const normalizeFlag = (v: any, nome: string) => {
  if (v === undefined || v === null || v === '') {
    throw { tipo: 'Validacao', mensagem: `Campo ${nome} e obrigatorio` };
  }

  if (typeof v === 'boolean') {
    return v ? 1 : 0;
  }

  const n = Number(v);
  if (!Number.isFinite(n) || (n !== 0 && n !== 1)) {
    throw { tipo: 'Validacao', mensagem: `Campo ${nome} deve ser 0 ou 1` };
  }

  return n;
};

const normalizeFlagOptional = (v: any, nome: string) => {
  if (v === undefined || v === null || v === '') {
    return null;
  }

  if (typeof v === 'boolean') {
    return v ? 1 : 0;
  }

  const n = Number(v);
  if (!Number.isFinite(n) || (n !== 0 && n !== 1)) {
    throw { tipo: 'Validacao', mensagem: `Campo ${nome} deve ser 0 ou 1` };
  }

  return n;
};

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

const normalizeIdOrNull = (v: any, nome: string) => {
  if (v === null || v === '') return null;
  return normalizeId(v, nome);
};

const normalizeNumber = (v: any, nome: string, allowNull = false) => {
  if (v === undefined || v === null || v === '') {
    if (allowNull) return null;
    throw { tipo: 'Validacao', mensagem: `Campo ${nome} e obrigatorio` };
  }
  const n = Number(v);
  if (!Number.isFinite(n)) {
    throw { tipo: 'Validacao', mensagem: `Campo ${nome} deve ser numerico` };
  }
  return n;
};

const normalizeInt = (v: any, nome: string, allowNull = false) => {
  const n = normalizeNumber(v, nome, allowNull);
  if (n === null) return null;
  if (!Number.isInteger(n)) {
    throw { tipo: 'Validacao', mensagem: `Campo ${nome} deve ser inteiro` };
  }
  return n;
};

const formatMySqlDateTime = (d: Date) => {
  const pad2 = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} ` +
    `${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;
};

const normalizeDate = (v: any, nome: string, valorPadrao: any = null) => {
  const raw = (v === undefined || v === null || v === '') ? valorPadrao : v;
  if (raw === undefined || raw === null || raw === '') return null;

  const d = raw instanceof Date ? raw : new Date(raw);
  if (isNaN(d.getTime())) {
    throw { tipo: 'Validacao', mensagem: `Campo ${nome} invalido` };
  }
  return formatMySqlDateTime(d);
};

const obterIdClientePorEntradaLote = async (idEntradaLote: number | null) => {
  if (!idEntradaLote) return null;
  const idCliente = await LotesFechamentoModel.buscarClientePorEntradaLoteId(idEntradaLote);
  const n = Number(idCliente);
  return Number.isFinite(n) && n > 0 ? n : null;
};

const criarNotificacaoFechamento = async (
  acao: 'Criacao' | 'Edicao' | 'Alteracao',
  payload: { idCliente?: number | null; idEntradaLote?: number | null },
  idFechamento?: number
) => {
  if (!payload?.idCliente) return;
  const alvo = payload.idEntradaLote
    ? `lote ${payload.idEntradaLote}`
    : (idFechamento ? `fechamento ${idFechamento}` : 'lote');
  await NotificacoesService.criar({
    descricao: `${acao} de fechamento de lote: ${alvo}`,
    url: '/lotes/lotessaidas',
    tipo: acao,
    idCliente: Number(payload.idCliente)
  });
};

export const criar = async (payload: LoteFechamentoBase) => {
  const id_entrada_lote = normalizeId(payload.id_entrada_lote, 'id_entrada_lote');
  const concluido100 = normalizeFlag(payload.concluido100, 'concluido100');
  const teveBonus = normalizeFlagOptional(payload.teveBonus, 'teveBonus');
  const bonusValor = normalizeNumber(payload.bonusValor, 'bonusValor', true);
  const pecasConcluidasSucesso = normalizeInt(payload.pecasConcluidasSucesso, 'pecasConcluidasSucesso', true);
  const acrescimoEntregaPercent = normalizeNumber(payload.acrescimoEntregaPercent, 'acrescimoEntregaPercent', true);
  const fechadoEm = normalizeDate(payload.fechadoEm, 'fechadoEm', new Date());

  const existeEntrada = await LotesFechamentoModel.verificarEntradaLotePorId(id_entrada_lote);
  if (!existeEntrada) {
    throw { tipo: 'LoteNaoEncontrado', mensagem: 'Entrada de lote nao encontrada.' };
  }

  const fechamentoExistente = await LotesFechamentoModel.buscarPorEntradaLoteId(id_entrada_lote);
  if (fechamentoExistente) {
    throw { tipo: 'LoteJaEncerrado', mensagem: 'O lote ja esta encerrado.' };
  }

  const data: LoteFechamentoBase = {
    id_entrada_lote,
    concluido100,
    teveBonus,
    bonusValor,
    pecasConcluidasSucesso,
    acrescimoEntregaPercent,
    fechadoEm
  };

  const result = await LotesFechamentoModel.inserir(data);
  await LotesModel.encerrarLote(id_entrada_lote);
  const idCliente = await obterIdClientePorEntradaLote(id_entrada_lote);
  await criarNotificacaoFechamento('Criacao', {
    idCliente,
    idEntradaLote: id_entrada_lote
  }, result.insertId);
  return { id: result.insertId, ...data };
};

export const listar = async (filtros: LoteFechamentoFiltro) => {
  const query: LoteFechamentoFiltro = { ...filtros };

  if (query.id_entrada_lote !== undefined && query.id_entrada_lote !== null && query.id_entrada_lote !== '') {
    query.id_entrada_lote = normalizeId(query.id_entrada_lote, 'id_entrada_lote');
  }

  if (query.concluido100 !== undefined && query.concluido100 !== null && query.concluido100 !== '') {
    query.concluido100 = normalizeFlag(query.concluido100, 'concluido100');
  }

  if (query.teveBonus !== undefined && query.teveBonus !== null && query.teveBonus !== '') {
    query.teveBonus = normalizeFlag(query.teveBonus, 'teveBonus');
  }

  normalizeDate(query.fechadoEmDe, 'fechadoEmDe');
  normalizeDate(query.fechadoEmAte, 'fechadoEmAte');

  return LotesFechamentoModel.listar(query);
};

export const obter = async (id: number) => {
  const item = await LotesFechamentoModel.buscarPorId(id);
  if (!item) throw { tipo: 'NaoEncontrado', mensagem: 'Fechamento nao encontrado' };
  return item;
};

export const atualizar = async (id: number, dados: Partial<LoteFechamentoBase>) => {
  const existente = await LotesFechamentoModel.buscarPorId(id);
  if (!existente) throw { tipo: 'NaoEncontrado', mensagem: 'Fechamento nao encontrado' };

  const id_entrada_loteAtual = existente.id_entrada_lote ?? null;
  const id_entrada_lote = dados.id_entrada_lote !== undefined
    ? normalizeIdOrNull(dados.id_entrada_lote, 'id_entrada_lote')
    : id_entrada_loteAtual;

  if (id_entrada_lote !== null && id_entrada_lote !== id_entrada_loteAtual) {
    const existeEntrada = await LotesFechamentoModel.verificarEntradaLotePorId(id_entrada_lote);
    if (!existeEntrada) {
      throw { tipo: 'LoteNaoEncontrado', mensagem: 'Entrada de lote nao encontrada.' };
    }

    const fechamentoExistente = await LotesFechamentoModel.buscarPorEntradaLoteId(id_entrada_lote);
    if (fechamentoExistente) {
      throw { tipo: 'LoteJaEncerrado', mensagem: 'O lote ja esta encerrado.' };
    }
  }

  const concluido100 = dados.concluido100 !== undefined
    ? normalizeFlag(dados.concluido100, 'concluido100')
    : existente.concluido100;

  const teveBonus = dados.teveBonus !== undefined
    ? normalizeFlagOptional(dados.teveBonus, 'teveBonus')
    : existente.teveBonus;

  const bonusValor = dados.bonusValor !== undefined
    ? normalizeNumber(dados.bonusValor, 'bonusValor', true)
    : existente.bonusValor;

  const pecasConcluidasSucesso = dados.pecasConcluidasSucesso !== undefined
    ? normalizeInt(dados.pecasConcluidasSucesso, 'pecasConcluidasSucesso', true)
    : existente.pecasConcluidasSucesso;

  const acrescimoEntregaPercent = dados.acrescimoEntregaPercent !== undefined
    ? normalizeNumber(dados.acrescimoEntregaPercent, 'acrescimoEntregaPercent', true)
    : existente.acrescimoEntregaPercent;

  const fechadoEm = dados.fechadoEm !== undefined
    ? normalizeDate(dados.fechadoEm, 'fechadoEm', existente.fechadoEm ?? null)
    : existente.fechadoEm;

  const payload: LoteFechamentoBase = {
    id_entrada_lote,
    concluido100,
    teveBonus,
    bonusValor,
    pecasConcluidasSucesso,
    acrescimoEntregaPercent,
    fechadoEm
  };

  const ok = await LotesFechamentoModel.atualizar(id, payload);
  if (!ok) throw { tipo: 'NaoEncontrado', mensagem: 'Fechamento nao encontrado' };

  const idCliente = await obterIdClientePorEntradaLote(payload.id_entrada_lote ?? null);
  await criarNotificacaoFechamento('Edicao', {
    idCliente,
    idEntradaLote: payload.id_entrada_lote ?? null
  }, id);
  return LotesFechamentoModel.buscarPorId(id);
};

export const remover = async (id: number) => {
  const existente = await LotesFechamentoModel.buscarPorId(id);
  if (!existente) throw { tipo: 'NaoEncontrado', mensagem: 'Fechamento nao encontrado' };
  const ok = await LotesFechamentoModel.remover(id);
  if (!ok) throw { tipo: 'NaoEncontrado', mensagem: 'Fechamento nao encontrado' };
  const idCliente = await obterIdClientePorEntradaLote(existente.id_entrada_lote ?? null);
  await criarNotificacaoFechamento('Alteracao', {
    idCliente,
    idEntradaLote: existente.id_entrada_lote ?? null
  }, id);
  return { id, removido: true };
};
