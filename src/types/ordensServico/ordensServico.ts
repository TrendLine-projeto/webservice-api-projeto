import { RowDataPacket } from 'mysql2/promise';

export interface OrdemServicoBase {
  descricao: string;
  descricaoAtivo?: string | null;
  numeroOrdem: string;
  dataAbertura?: string | null;
  ordemManual?: number | null;
  finalizado?: number | null;
  dataFinalizado?: string | null;
  descricaoFinalizado?: string | null;
  idCliente: number;
}

export interface OrdemServico extends OrdemServicoBase {
  id: number;
}

export interface OrdemServicoRow extends RowDataPacket, OrdemServico {}

export interface PaginacaoParams {
  pagina?: number | string;
  quantidadePorPagina?: number | string;
  idCliente?: number | string;
  finalizado?: number | string;
  ordemManual?: number | string;
  numeroOrdem?: string;
  busca?: string;
  dataAberturaDe?: string;
  dataAberturaAte?: string;
}
