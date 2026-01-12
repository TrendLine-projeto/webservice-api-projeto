import { RowDataPacket } from 'mysql2/promise';

export interface NotificacaoBase {
  descricao: string;
  url: string;
  tipo: string;
  dataCriacao?: string | Date | null;
  idCliente: number;
  lido?: number;
}

export interface Notificacao extends NotificacaoBase {
  id: number;
}

export interface NotificacaoRow extends RowDataPacket, Notificacao {}

export interface PaginacaoParams {
  pagina?: number | string;
  quantidadePorPagina?: number | string;
  idCliente?: number | string;
  tipo?: string;
  busca?: string;
  dataCriacaoDe?: string;
  dataCriacaoAte?: string;
  lido?: number | string;
}
