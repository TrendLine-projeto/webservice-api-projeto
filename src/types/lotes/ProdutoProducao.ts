/* INTERFACE PARA PRODUTOS DE PRODUÇÃO */
export interface ProdutoProducao {
  nomeProduto: string;
  tipoEstilo: string;
  tamanho: string;
  corPrimaria: string;
  corSecundaria?: string;
  valorPorPeca: number;
  quantidadeProduto: number;
  dataEntrada?: string;
  dataPrevistaSaida?: string;
  dataSaida?: string;
  imagem?: string;
  finalizado?: number;
}