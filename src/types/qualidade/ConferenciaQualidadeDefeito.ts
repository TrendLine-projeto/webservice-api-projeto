import { RowDataPacket } from 'mysql2/promise';

export interface ConferenciaQualidadeDefeitoBase {
  id?: number;
  idConferenciaQualidade?: number | null;
  tipoDefeito?: string | null;
  quantidade?: number | null;
  observacao?: string | null;
}

export interface ConferenciaQualidadeDefeito extends ConferenciaQualidadeDefeitoBase {
  id: number;
}

export interface ConferenciaQualidadeDefeitoRow extends RowDataPacket, ConferenciaQualidadeDefeito {}

export interface ConferenciaQualidadeDefeitoFiltro {
  pagina?: number | string;
  quantidadePorPagina?: number | string;
  idConferenciaQualidade?: number | string;
  tipoDefeito?: string;
  quantidade?: number | string;
  observacao?: string;
}
