export interface FiltrosInsumoTecnico {
  idCliente: number;
  idFornecedor_suprimentos: number;
  pagina?: number;
  quantidadePorPagina?: number;
  nome?: string;
  tipo?: string;
  cor?: string;
  marca?: string;
  unidade?: string;
  localArmazenamento?: string;
}