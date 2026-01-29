import * as ConferenciasQualidadeModel from '../../models/conferenciasQualidade';
import * as ConferenciaQualidadeDefeitosModel from '../../models/conferenciaQualidadeDefeitos';
import {
  ConferenciaQualidadeBase,
  ConferenciaQualidadeFiltro
} from '../../types/qualidade/ConferenciaQualidade';

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

const normalizeFlag = (v: any, nome: string, allowNull = false, defaultValue?: number | null) => {
  if (v === undefined || v === '') {
    return defaultValue;
  }
  if (v === null) {
    if (allowNull) return null;
    return defaultValue ?? 0;
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

const normalizeInt = (
  v: any,
  nome: string,
  allowNull = false,
  defaultValue?: number | null
) => {
  if (v === undefined || v === '') {
    return defaultValue;
  }
  if (v === null) {
    if (allowNull) return null;
    return defaultValue ?? 0;
  }
  const n = Number(v);
  if (!Number.isFinite(n) || !Number.isInteger(n) || n < 0) {
    throw { tipo: 'Validacao', mensagem: `Campo ${nome} deve ser um inteiro maior ou igual a zero` };
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

const normalizeIdentificador = (v: any) => {
  if (v === undefined || v === null || v === '') return null;
  const identificador = String(v).trim();
  if (!identificador) return null;
  if (identificador.length > 45) {
    throw { tipo: 'Validacao', mensagem: 'Campo identificador deve ter no maximo 45 caracteres' };
  }
  return identificador;
};

const gerarIdentificador = () => {
  const time = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `CQ-${time}-${rand}`;
};

const gerarIdentificadorUnico = async () => {
  for (let tentativa = 0; tentativa < 5; tentativa += 1) {
    const candidato = gerarIdentificador();
    const existe = await ConferenciasQualidadeModel.verificarIdentificadorExiste(candidato);
    if (!existe) return candidato;
  }
  throw { tipo: 'Validacao', mensagem: 'Nao foi possivel gerar identificador unico' };
};

const validarQuantidadesProduto = async (
  idProdutoProducao: number,
  qtdInspecionada: number | null | undefined,
  qtdAprovada: number | null | undefined,
  qtdReprovada: number | null | undefined
) => {
  const quantidadeProduto = await ConferenciasQualidadeModel.buscarQuantidadeProdutoProducao(idProdutoProducao);
  if (quantidadeProduto === null || quantidadeProduto === undefined) return;

  const aprovadas = Number(qtdAprovada ?? 0);
  const reprovadas = Number(qtdReprovada ?? 0);
  const inspecionadas = Number(qtdInspecionada ?? 0);
  const soma = aprovadas + reprovadas;

  if (inspecionadas > quantidadeProduto) {
    throw { tipo: 'Validacao', mensagem: 'Qtd inspecionada nao pode ser maior que a quantidade do produto' };
  }

  if (soma > quantidadeProduto) {
    throw { tipo: 'Validacao', mensagem: 'Qtd aprovada + reprovada nao pode ser maior que a quantidade do produto' };
  }
};

export const criar = async (payload: ConferenciaQualidadeBase) => {
  const idProdutoProducao = normalizeId(payload.idProdutoProducao, 'idProdutoProducao');
  const existeProduto = await ConferenciasQualidadeModel.verificarProdutoProducaoPorId(idProdutoProducao);
  if (!existeProduto) {
    throw { tipo: 'ProdutoNaoEncontrado', mensagem: 'Produto de producao nao encontrado.' };
  }
  const existeFinalizada = await ConferenciasQualidadeModel.verificarConferenciaFinalizadaPorProdutoId(idProdutoProducao);
  if (existeFinalizada) {
    throw { tipo: 'ConferenciaFinalizada', mensagem: 'Ja existe uma conferencia finalizada para este produto.' };
  }

  const dataConferencia = normalizeDate(payload.dataConferencia, 'dataConferencia', new Date());
  const qtdInspecionada = normalizeInt(payload.qtdInspecionada, 'qtdInspecionada', true, 0);
  const qtdAprovada = normalizeInt(payload.qtdAprovada, 'qtdAprovada', true, 0);
  const qtdReprovada = normalizeInt(payload.qtdReprovada, 'qtdReprovada', true, 0);
  const requerReinspecao = normalizeFlag(payload.requerReinspecao, 'requerReinspecao', true, 0);
  const finalizada = normalizeFlag(payload.finalizada, 'finalizada', true, 0);
  const identificadorInformado = normalizeIdentificador(payload.identificador);
  const identificador = identificadorInformado
    ? identificadorInformado
    : await gerarIdentificadorUnico();

  if (identificadorInformado) {
    const existeIdentificador = await ConferenciasQualidadeModel.verificarIdentificadorExiste(identificadorInformado);
    if (existeIdentificador) {
      throw { tipo: 'Validacao', mensagem: 'Identificador ja cadastrado para outra conferencia.' };
    }
  }

  const data: ConferenciaQualidadeBase = {
    idProdutoProducao,
    identificador,
    dataConferencia,
    status: payload.status ?? null,
    qtdInspecionada,
    qtdAprovada,
    qtdReprovada,
    observacaoGeral: payload.observacaoGeral ?? null,
    requerReinspecao,
    finalizada
  };

  await validarQuantidadesProduto(idProdutoProducao, qtdInspecionada, qtdAprovada, qtdReprovada);

  const result = await ConferenciasQualidadeModel.inserir(data);
  return { id: result.insertId, ...data };
};

export const listar = async (filtros: ConferenciaQualidadeFiltro) => {
  const query: ConferenciaQualidadeFiltro = { ...filtros };

  if (query.idProdutoProducao !== undefined && query.idProdutoProducao !== null && query.idProdutoProducao !== '') {
    query.idProdutoProducao = normalizeId(query.idProdutoProducao, 'idProdutoProducao');
  }

  if (query.identificador !== undefined && query.identificador !== null && query.identificador !== '') {
    query.identificador = normalizeIdentificador(query.identificador) ?? '';
  }

  if (query.requerReinspecao !== undefined && query.requerReinspecao !== null && query.requerReinspecao !== '') {
    const requerReinspecao = normalizeFlag(query.requerReinspecao, 'requerReinspecao', true);
    if (requerReinspecao !== null && requerReinspecao !== undefined) {
      query.requerReinspecao = requerReinspecao;
    } else {
      delete query.requerReinspecao;
    }
  }

  if (query.finalizada !== undefined && query.finalizada !== null && query.finalizada !== '') {
    const finalizada = normalizeFlag(query.finalizada, 'finalizada', true);
    if (finalizada !== null && finalizada !== undefined) {
      query.finalizada = finalizada;
    } else {
      delete query.finalizada;
    }
  }

  if (query.dataConferenciaDe) {
    const dataConferenciaDe = normalizeDate(query.dataConferenciaDe, 'dataConferenciaDe');
    if (dataConferenciaDe !== null && dataConferenciaDe !== undefined) {
      query.dataConferenciaDe = dataConferenciaDe;
    } else {
      delete query.dataConferenciaDe;
    }
  }

  if (query.dataConferenciaAte) {
    const dataConferenciaAte = normalizeDate(query.dataConferenciaAte, 'dataConferenciaAte');
    if (dataConferenciaAte !== null && dataConferenciaAte !== undefined) {
      query.dataConferenciaAte = dataConferenciaAte;
    } else {
      delete query.dataConferenciaAte;
    }
  }

  return ConferenciasQualidadeModel.listar(query);
};

export const obter = async (id: number) => {
  const item = await ConferenciasQualidadeModel.buscarPorId(id);
  if (!item) throw { tipo: 'NaoEncontrado', mensagem: 'Conferencia de qualidade nao encontrada' };
  return item;
};

export const atualizar = async (id: number, dados: Partial<ConferenciaQualidadeBase>) => {
  const existente = await ConferenciasQualidadeModel.buscarPorId(id);
  if (!existente) throw { tipo: 'NaoEncontrado', mensagem: 'Conferencia de qualidade nao encontrada' };

  const idProdutoProducao = dados.idProdutoProducao !== undefined
    ? normalizeId(dados.idProdutoProducao, 'idProdutoProducao')
    : existente.idProdutoProducao;

  if (idProdutoProducao !== existente.idProdutoProducao) {
    const existeProduto = await ConferenciasQualidadeModel.verificarProdutoProducaoPorId(idProdutoProducao);
    if (!existeProduto) {
      throw { tipo: 'ProdutoNaoEncontrado', mensagem: 'Produto de producao nao encontrado.' };
    }
  }

  const dataConferencia = dados.dataConferencia !== undefined
    ? normalizeDate(dados.dataConferencia, 'dataConferencia', existente.dataConferencia ?? null)
    : existente.dataConferencia;

  const qtdInspecionada = dados.qtdInspecionada !== undefined
    ? normalizeInt(dados.qtdInspecionada, 'qtdInspecionada', true)
    : existente.qtdInspecionada;

  const qtdAprovada = dados.qtdAprovada !== undefined
    ? normalizeInt(dados.qtdAprovada, 'qtdAprovada', true)
    : existente.qtdAprovada;

  const qtdReprovada = dados.qtdReprovada !== undefined
    ? normalizeInt(dados.qtdReprovada, 'qtdReprovada', true)
    : existente.qtdReprovada;

  const requerReinspecao = dados.requerReinspecao !== undefined
    ? normalizeFlag(dados.requerReinspecao, 'requerReinspecao', true)
    : existente.requerReinspecao;

  const finalizada = dados.finalizada !== undefined
    ? normalizeFlag(dados.finalizada, 'finalizada', true)
    : existente.finalizada;

  const payload: ConferenciaQualidadeBase = {
    idProdutoProducao,
    identificador: existente.identificador ?? null,
    dataConferencia,
    status: dados.status !== undefined ? (dados.status ?? null) : existente.status,
    qtdInspecionada,
    qtdAprovada,
    qtdReprovada,
    observacaoGeral: dados.observacaoGeral !== undefined ? (dados.observacaoGeral ?? null) : existente.observacaoGeral,
    requerReinspecao,
    finalizada
  };

  await validarQuantidadesProduto(idProdutoProducao, qtdInspecionada, qtdAprovada, qtdReprovada);

  const ok = await ConferenciasQualidadeModel.atualizar(id, payload);
  if (!ok) throw { tipo: 'NaoEncontrado', mensagem: 'Conferencia de qualidade nao encontrada' };
  return ConferenciasQualidadeModel.buscarPorId(id);
};

export const remover = async (id: number) => {
  const existente = await ConferenciasQualidadeModel.buscarPorId(id);
  if (!existente) throw { tipo: 'NaoEncontrado', mensagem: 'Conferencia de qualidade nao encontrada' };
  await ConferenciaQualidadeDefeitosModel.removerPorConferenciaId(id);
  const ok = await ConferenciasQualidadeModel.remover(id);
  if (!ok) throw { tipo: 'NaoEncontrado', mensagem: 'Conferencia de qualidade nao encontrada' };
  return { id, removido: true };
};
