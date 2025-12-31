// src/types/Manutencao/Manutencao.ts
import { RowDataPacket } from 'mysql2/promise';

export interface ManutencaoBase {
  idCliente: number;                 // cliente dono da máquina
  tipo: string;                       // ex: preventiva | corretiva | calibracao
  data_execucao?: string | null;      // 'YYYY-MM-DD'
  proxima_prevista?: string | null;   // 'YYYY-MM-DD'
  status?: string | null;             // ex: planejada | em_execucao | concluida | cancelada
  custo?: number | null;
  responsavel?: string | null;
  observacoes?: string | null;
  idMaquina: number;                  // FK para maquinas.id
}

export interface Manutencao extends ManutencaoBase {
  id: number;
}

export interface ManutencaoRow extends RowDataPacket, Manutencao {}

export interface PaginacaoParams {
  pagina?: number | string;              // 1-based
  quantidadePorPagina?: number | string; // default 10
  idMaquina?: number | string;
  idCliente?: number | string;
  status?: string;
  tipo?: string;
  busca?: string;                        // livre: responsavel / observacoes
}
