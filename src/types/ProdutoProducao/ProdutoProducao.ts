/* INTERFACE PARA PRODUTOS DE PRODUÇÃO */
export interface ProdutoProducao {
    numeroIdentificador: string
    nomeProduto: string;
    tipoEstilo: string;
    tamanho: string;
    corPrimaria: string;
    corSecundaria?: string;
    valorPorPeca: number;
    quantidadeProduto: number;
    someValorTotalProduto: number;
    dataEntrada?: string;
    dataPrevistaSaida?: string;
    dataSaida?: string;
    imagem?: string;
    finalizado?: number;

    marca?: string,
    pesoLiquido?: number,
    pesoBruto?: number,
    volumes?: number,
    itensPorCaixa?: number,
    descricaoCurta?: string,
    largura?: number,
    altura?: number,
    profundidade?: number,
    estoqueMinimo?: number,
    estoqueMaximo?: number,
    estoqueCrossdocking?: number,
    estoqueLocalizacao?: string,

    idEntrada_lotes?: number;
    idFilial: number;
}