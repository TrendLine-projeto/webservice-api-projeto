import { ProdutoProducao } from '../../types/lotes/ProdutoProducao';

/* INTERFACE PARA CRIAÇÃO DE UM NOVO LOTE */
export interface EntradaDeLote {
  numeroIdentificador: string;
  nomeEntregador: string;
  nomeRecebedor: string;
  valorEstimado: number;
  valorHoraEstimado: number;
  dataEntrada?: string;
  dataPrevistaSaida?: string;
  loteIniciado: boolean;
  idFilial: number;
  produtos?: ProdutoProducao[];
}