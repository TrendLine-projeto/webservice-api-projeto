import * as dashboardModel from '../../models/dashboard';

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
