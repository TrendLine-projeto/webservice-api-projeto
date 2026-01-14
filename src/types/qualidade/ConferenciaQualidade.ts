import { RowDataPacket } from 'mysql2/promise';

export interface ConferenciaQualidadeBase {
  idProdutoProducao: number;
  identificador?: string | null;
  dataConferencia?: string | Date | null;
  status?: string | null;
  qtdInspecionada?: number | null;
  qtdAprovada?: number | null;
  qtdReprovada?: number | null;
  observacaoGeral?: string | null;
  requerReinspecao?: number | null;
  finalizada?: number | null;
}

export interface ConferenciaQualidade extends ConferenciaQualidadeBase {
  id: number;
}

export interface ConferenciaQualidadeRow extends RowDataPacket, ConferenciaQualidade {}

export interface ConferenciaQualidadeFiltro {
  pagina?: number | string;
  quantidadePorPagina?: number | string;
  idProdutoProducao?: number | string;
  identificador?: string;
  status?: string;
  requerReinspecao?: number | string;
  finalizada?: number | string;
  dataConferenciaDe?: string;
  dataConferenciaAte?: string;
}
