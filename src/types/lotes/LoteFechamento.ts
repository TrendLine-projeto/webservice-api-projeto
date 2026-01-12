import { RowDataPacket } from 'mysql2/promise';

export interface LoteFechamentoBase {
  id_entrada_lote?: number | null;
  concluido100: number;
  teveBonus?: number | null;
  bonusValor?: number | null;
  pecasConcluidasSucesso?: number | null;
  acrescimoEntregaPercent?: number | null;
  fechadoEm?: string | Date | null;
}

export interface LoteFechamento extends LoteFechamentoBase {
  id: number;
}

export interface LoteFechamentoRow extends RowDataPacket, LoteFechamento {}

export interface LoteFechamentoFiltro {
  pagina?: number | string;
  quantidadePorPagina?: number | string;
  id_entrada_lote?: number | string;
  concluido100?: number | string;
  teveBonus?: number | string;
  fechadoEmDe?: string;
  fechadoEmAte?: string;
}
