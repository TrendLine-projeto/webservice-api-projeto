import { RowDataPacket } from 'mysql2/promise';

export interface ConferenciaEstoqueParams {
  tabela: number;
  idCliente: number;
  pagina: number | string;
  quantidadePorPagina: number | string;
}

export interface ItemEstoque extends RowDataPacket {
  id: number;
  nome: string;
  unidade: string;
  quantidade: number;
  estoqueMinimo: number;
}

export interface ConferenciaPayload {
    id_produto: number;
    quantidade_sistema: number;
    quantidade_conferida: number;
    tabela_origem: number;
    id_cliente: number;
}