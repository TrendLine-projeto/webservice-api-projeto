import * as dashboardModel from '../../models/dashboard';
import * as notificacoesService from '../notificacoes/notificacoes';

const toNumber = (value: any) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const clampMeses = (meses: number) => {
  if (!Number.isFinite(meses)) return 6;
  if (meses < 1) return 1;
  if (meses > 24) return 24;
  return Math.floor(meses);
};

const normalizeDateTime = (value: any, nome: string, boundary: 'start' | 'end') => {
  if (value === undefined || value === null || value === '') return null;
  const raw = String(value);
  const hasTime = /\d{2}:\d{2}/.test(raw);
  const datePart = raw.slice(0, 10);
  const normalized = hasTime
    ? raw
    : `${datePart} ${boundary === 'end' ? '23:59:59' : '00:00:00'}`;
  const test = new Date(normalized.replace(' ', 'T'));
  if (isNaN(test.getTime())) {
    throw { status: 400, mensagem: `Campo ${nome} invalido` };
  }
  return normalized;
};

const formatDateBoundary = (date: Date, boundary: 'start' | 'end') => {
  const pad = (n: number) => String(n).padStart(2, '0');
  const yyyy = date.getFullYear();
  const mm = pad(date.getMonth() + 1);
  const dd = pad(date.getDate());
  const time = boundary === 'end' ? '23:59:59' : '00:00:00';
  return `${yyyy}-${mm}-${dd} ${time}`;
};

const validateRange = (dataEntradaDe: string | null, dataEntradaAte: string | null) => {
  if (!dataEntradaDe || !dataEntradaAte) return;
  const ini = new Date(dataEntradaDe.replace(' ', 'T')).getTime();
  const fim = new Date(dataEntradaAte.replace(' ', 'T')).getTime();
  if (Number.isFinite(ini) && Number.isFinite(fim) && ini > fim) {
    throw { status: 400, mensagem: 'dataEntradaDe deve ser menor ou igual a dataEntradaAte' };
  }
};

export const obterCards = async (
  idFornecedor: number,
  dataEntradaDe?: string | null,
  dataEntradaAte?: string | null
) => {
  if (!idFornecedor || Number.isNaN(idFornecedor)) {
    throw { status: 400, mensagem: 'idFornecedor_producao e obrigatorio' };
  }

  const dataDe = normalizeDateTime(dataEntradaDe, 'dataEntradaDe', 'start');
  const dataAte = normalizeDateTime(dataEntradaAte, 'dataEntradaAte', 'end');
  validateRange(dataDe, dataAte);

  const resumo = await dashboardModel.buscarResumoPorFornecedor(idFornecedor, dataDe, dataAte);

  return {
    idFornecedor_producao: idFornecedor,
    cards: {
      totalLotes: toNumber(resumo.totalLotes),
      lotesIniciados: toNumber(resumo.lotesIniciados),
      lotesNaoIniciados: toNumber(resumo.lotesNaoIniciados),
      lotesEmProducao: toNumber(resumo.lotesEmProducao),
      lotesFinalizados: toNumber(resumo.lotesFinalizados),
      valorTotal: toNumber(resumo.valorTotal),
      valorRecebido: toNumber(resumo.valorRecebido),
      valorEmProducao: toNumber(resumo.valorEmProducao),
      valorAReceber: toNumber(resumo.valorAReceber)
    }
  };
};

export const obterSerieMensal = async (
  idFornecedor: number,
  meses: number,
  dataEntradaDe?: string | null,
  dataEntradaAte?: string | null
) => {
  if (!idFornecedor || Number.isNaN(idFornecedor)) {
    throw { status: 400, mensagem: 'idFornecedor_producao e obrigatorio' };
  }

  const dataDe = normalizeDateTime(dataEntradaDe, 'dataEntradaDe', 'start');
  const dataAte = normalizeDateTime(dataEntradaAte, 'dataEntradaAte', 'end');
  validateRange(dataDe, dataAte);

  const mesesLimite = dataDe || dataAte ? null : clampMeses(meses);
  const serie = await dashboardModel.buscarSerieMensalPorFornecedor(
    idFornecedor,
    mesesLimite,
    dataDe,
    dataAte
  );

  return {
    idFornecedor_producao: idFornecedor,
    meses: mesesLimite ?? null,
    serie: serie.map((item: any) => ({
      mes: item.mes,
      totalLotes: toNumber(item.totalLotes),
      valorTotal: toNumber(item.valorTotal),
      valorRecebido: toNumber(item.valorRecebido),
      valorEmProducao: toNumber(item.valorEmProducao),
      valorAReceber: toNumber(item.valorAReceber)
    }))
  };
};

export const obterOperacaoAlertas = async (params: {
  idCliente: number;
  dataEntradaDe?: string | null;
  dataEntradaAte?: string | null;
  idFilial?: number | null;
  idFornecedor?: number | null;
  limite?: number | null;
  diasRisco?: number | null;
}) => {
  const idCliente = Number(params.idCliente);
  if (!idCliente || Number.isNaN(idCliente)) {
    throw { status: 400, mensagem: 'idCliente e obrigatorio' };
  }

  const dataDe = normalizeDateTime(params.dataEntradaDe, 'dataEntradaDe', 'start');
  const dataAte = normalizeDateTime(params.dataEntradaAte, 'dataEntradaAte', 'end');
  validateRange(dataDe, dataAte);

  const idFilial = params.idFilial ? Number(params.idFilial) : null;
  const idFornecedor = params.idFornecedor ? Number(params.idFornecedor) : null;
  const limite = Number.isFinite(Number(params.limite)) ? Number(params.limite) : 20;
  const diasRisco = Number.isFinite(Number(params.diasRisco)) ? Number(params.diasRisco) : 2;

  const hoje = new Date();
  const seteDias = new Date(hoje.getTime() + 7 * 24 * 60 * 60 * 1000);
  const trintaDiasAtras = new Date(hoje.getTime() - 30 * 24 * 60 * 60 * 1000);

  const periodoPrevistoDe = dataDe ?? formatDateBoundary(hoje, 'start');
  const periodoPrevistoAte = dataAte ?? formatDateBoundary(seteDias, 'end');

  const periodoRiscoDe = dataDe ?? formatDateBoundary(trintaDiasAtras, 'start');
  const periodoRiscoAte = dataAte ?? formatDateBoundary(seteDias, 'end');

  const [
    lotesPorFilialRaw,
    lotesPorFornecedorRaw,
    previsaoSaidaRaw,
    agingRaw,
    lotesRiscoRaw,
    notificacoesRaw
  ] = await Promise.all([
    dashboardModel.buscarLotesPorFilial(idCliente, dataDe, dataAte, idFilial, idFornecedor),
    dashboardModel.buscarLotesPorFornecedor(idCliente, dataDe, dataAte, idFilial, idFornecedor),
    dashboardModel.buscarPrevisaoSaida(
      idCliente,
      periodoPrevistoDe,
      periodoPrevistoAte,
      limite,
      idFilial,
      idFornecedor
    ),
    dashboardModel.buscarAgingLotesAberto(idCliente, dataDe, dataAte, idFilial, idFornecedor),
    dashboardModel.buscarLotesRiscoAtraso(
      idCliente,
      periodoRiscoDe,
      periodoRiscoAte,
      diasRisco,
      limite,
      idFilial,
      idFornecedor
    ),
    notificacoesService.listar({
      pagina: 1,
      quantidadePorPagina: 10,
      idCliente,
      dataCriacaoDe: dataDe ?? undefined,
      dataCriacaoAte: dataAte ?? undefined
    })
  ]);

  const lotesPorFilial = lotesPorFilialRaw.map((item: any) => ({
    idFilial: Number(item.idFilial),
    nomeFilial: item.nomeFilial,
    totalLotes: toNumber(item.totalLotes),
    lotesFinalizados: toNumber(item.lotesFinalizados),
    lotesEmProducao: toNumber(item.lotesEmProducao),
    lotesNaoIniciados: toNumber(item.lotesNaoIniciados),
    valorTotal: toNumber(item.valorTotal)
  }));

  const lotesPorFornecedor = lotesPorFornecedorRaw.map((item: any) => ({
    idFornecedor: Number(item.idFornecedor),
    nomeFornecedor: item.nomeFornecedor || 'Fornecedor',
    cnpjFornecedor: item.cnpjFornecedor || null,
    totalLotes: toNumber(item.totalLotes),
    lotesFinalizados: toNumber(item.lotesFinalizados),
    lotesEmProducao: toNumber(item.lotesEmProducao),
    lotesNaoIniciados: toNumber(item.lotesNaoIniciados),
    valorTotal: toNumber(item.valorTotal)
  }));

  const previsaoSaida = previsaoSaidaRaw.map((item: any) => ({
    id: Number(item.id),
    numeroIdentificador: item.numeroIdentificador,
    dataPrevistaSaida: item.dataPrevistaSaida,
    loteIniciado: item.loteIniciado,
    loteFinalizado: item.loteFinalizado,
    idFilial: Number(item.idFilial),
    nomeFilial: item.nomeFilial,
    idFornecedor: Number(item.idFornecedor),
    nomeFornecedor: item.nomeFornecedor || 'Fornecedor'
  }));

  const agingAberto = {
    totalAberto: toNumber(agingRaw.totalAberto),
    ate7: toNumber(agingRaw.ate7),
    de8a15: toNumber(agingRaw.de8a15),
    de16a30: toNumber(agingRaw.de16a30),
    acima30: toNumber(agingRaw.acima30)
  };

  const lotesRiscoAtraso = lotesRiscoRaw.map((item: any) => {
    const diasParaPrazo = toNumber(item.diasParaPrazo);
    const status = diasParaPrazo < 0 ? 'atrasado' : 'risco';
    return {
      id: Number(item.id),
      numeroIdentificador: item.numeroIdentificador,
      dataPrevistaSaida: item.dataPrevistaSaida,
      loteIniciado: item.loteIniciado,
      loteFinalizado: item.loteFinalizado,
      idFilial: Number(item.idFilial),
      nomeFilial: item.nomeFilial,
      idFornecedor: Number(item.idFornecedor),
      nomeFornecedor: item.nomeFornecedor || 'Fornecedor',
      diasParaPrazo,
      status
    };
  });

  return {
    filtros: {
      dataEntradaDe: dataDe,
      dataEntradaAte: dataAte,
      periodoPrevistoDe,
      periodoPrevistoAte,
      periodoRiscoDe,
      periodoRiscoAte
    },
    operacao: {
      lotesPorFilial,
      lotesPorFornecedor,
      previsaoSaida,
      agingAberto
    },
    alertas: {
      notificacoes: notificacoesRaw?.itens || [],
      lotesRiscoAtraso
    }
  };
};
