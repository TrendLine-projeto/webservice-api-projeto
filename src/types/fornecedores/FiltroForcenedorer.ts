export interface FiltrosFornecedor {
    cliente_id: number;
    pagina?: number;
    quantidadePorPagina?: number;
    razaoSocial?: string;
    cidade?: string;
    estado?: string;
    ativo?: number;
    tipoFornecedor?: string;
}