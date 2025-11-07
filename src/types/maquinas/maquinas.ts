// src/types/Maquina/Maquina.ts
import { RowDataPacket } from 'mysql2/promise';

export interface MaquinaBase {
  codigo_interno: string;
  nome: string;
  descricao?: string | null;
  tipo?: string | null;
  setor?: string | null;
  fabricante?: string | null;
  modelo?: string | null;
  numero_serie: string;
  ano_fabricacao?: number | null;
  capacidade_producao?: string | null;
  tensao?: string | null;
  potencia_kw?: number | null;
  horimetro_atual?: number | null;
  vida_util_estimada?: number | null;
  status?: string | null; // ex: 'ativo', 'inativo', 'manutencao'
  data_aquisicao?: string | null;    // 'YYYY-MM-DD'
  garantia_ate?: string | null;      // 'YYYY-MM-DD'
  localizacao?: string | null;
  proxima_manutencao?: string | null; // 'YYYY-MM-DD'
  ultima_manutencao?: string | null;  // 'YYYY-MM-DD'
  mtbf?: number | null;
  mttr?: number | null;
  valor_aquisicao?: number | null;
  custo_acumulado_manut?: number | null;
  observacoes?: string | null;
}

export interface Maquina extends MaquinaBase {
  id: number;
  criado_em?: string;
  atualizado_em?: string | null;
}

export interface MaquinaRow extends RowDataPacket, Maquina {}

export interface PaginacaoParams {
  pagina?: number | string;              // 1-based
  quantidadePorPagina?: number | string; // default 10
  busca?: string;                        // nome / modelo / numero_serie / codigo_interno
  setor?: string;
  tipo?: string;
  status?: string;
}

export type DatasManutencaoBody = {
  ultima_manutencao?: string | null;   // 'YYYY-MM-DD'
  proxima_manutencao?: string | null;  // 'YYYY-MM-DD'
};

export type DatasManutencao = {
  ultima_manutencao?: string | null;
  proxima_manutencao?: string | null;
};

