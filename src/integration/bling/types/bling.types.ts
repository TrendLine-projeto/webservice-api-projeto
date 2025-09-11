// src/integrations/bling/bling.types.ts

export type BlingTipo = 'P' | 'S' | 'N';
export type BlingFormato = 'S' | 'E' | 'V';
export type BlingSituacao = 'A' | 'I';

/** bloco “core” obrigatório/mais comum */
export type BlingCore = {
    nome:                                string;
    codigo:                              string;
    preco?:                              number;
    unidade?:                            string; 
    tipo?:                               BlingTipo;
    formato?:                            BlingFormato;
    descricao?:                          string;
    situacao?:                           BlingSituacao;
};

/** características (aba “Características” no Bling) */
export type BlingCaracteristicas = {
    marca?:                              string;
    producao?:                           'P' | 'T';
    dataValidade?:                       string;
    freteGratis?:                        boolean;
    pesoLiquido?:                        number;
    pesoBruto?:                          number;
    largura?:                            number;
    altura?:                             number;
    profundidade?:                       number;
    volumes?:                            number;
    itensPorCaixa?:                      number;
    descricaoCurta?:                     string;
    unidadeMedida?:                      string;
    gtin?:                               string;
    gtinTributario?:                     string;
};

/** dimensões agrupadas (nova estrutura no Bling) */
export type BlingDimensoes = {
    largura?:                            number;
    altura?:                             number;
    profundidade?:                       number;
    unidadeMedida?:                      string;
};

/** dimensões agrupadas (nova estrutura no Bling) */
export type BlingEstoque = {
    minimo?:                             number;
    maximo?:                             number;
    crossdocking?:                       number;
    localizacao?:                        string;
};

/** atributo livre (vai em “Características”) */
export type BlingAtributo = { 
    nome:                                string; 
    valor:                               string;
};

/** input de criação/atualização que você passa para o client */
export type BlingProductInput = {
    core:                                BlingCore;
    dimensoes?:                          BlingDimensoes;
    caracteristicas?:                    BlingCaracteristicas;
    estoque?:                            BlingEstoque;
    atributos?:                          BlingAtributo[];
};

/** tipo “flat” caso queira ainda usar direto no POST */
export type BlingProductFlat =
    BlingCore &
    BlingCaracteristicas & {
        dimensoes?:                      BlingDimensoes;
        estoque?:                        BlingEstoque;
        atributos?:                      BlingAtributo[];
        id?:                             number;
    };
