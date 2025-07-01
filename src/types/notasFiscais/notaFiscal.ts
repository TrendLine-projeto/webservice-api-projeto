export interface NotaFiscal {
  chaveAcesso: string;
  numeroNota: string;
  serie: string;
  dataEmissao: string;
  valorProdutos: number;
  valorFrete: number;
  valorICMS: number;
  valorIPI: number;
  transportadora: string;
  qtdVolumes: number;
  pesoBruto: number;
}