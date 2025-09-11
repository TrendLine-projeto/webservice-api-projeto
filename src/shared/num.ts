export const toNum = (v: any): number | undefined => {
  if (v === '' || v === null || v === undefined) return undefined;
  const n = typeof v === 'string' ? Number(v.replace(',', '.')) : Number(v);
  return Number.isFinite(n) ? n : undefined;
};

export const toIntBool = (v?: boolean | number | null) => (v ? 1 : 0);

export const calcTotal = (valorPorPeca?: any, quantidade?: any) =>
  (toNum(valorPorPeca) ?? 0) * (toNum(quantidade) ?? 0);