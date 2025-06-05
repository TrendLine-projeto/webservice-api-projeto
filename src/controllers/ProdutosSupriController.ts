import { Request, Response } from 'express';
import * as ProdutosSupriService from '../service/produtos_suprimentos/produtos_suprimentosBase';
import dotenv from 'dotenv';

dotenv.config();

export const criarProduto = async (req: Request, res: Response) => {
  try {
    const produtoCriado = await ProdutosSupriService.criarProduto(req.body);
    return res.status(201).send({
      mensagem: 'Produto de suprimentos criado com sucesso!',
      produtoCriado
    });
  } catch (error: any) {
    if (error.tipo === 'FornecedorNaoEncontrado') {
      return res.status(404).send({ mensagem: error.mensagem });
    }
    return res.status(500).send({ error: error.message || error });
  }
};

export const buscarProdutosPorCliente = async (req: Request, res: Response) => {
  try {
    const filtros = req.body;

    const resultado = await ProdutosSupriService.buscarProdutosPorCliente(filtros);

    if (resultado.totalRegistros === 0) {
      return res.status(404).send({ mensagem: 'Nenhum produto encontrado para esse cliente.' });
    }

    return res.status(200).send({
      mensagem: 'Produtos encontrados com sucesso!',
      paginaAtual: filtros.pagina,
      quantidadePorPagina: filtros.quantidadePorPagina,
      totalRegistros: resultado.totalRegistros,
      produtos: resultado.produtos
    });
  } catch (error: any) {
    if (error.tipo === 'Validacao') {
      return res.status(400).send({ mensagem: error.mensagem });
    }
    return res.status(500).send({ error: error.message || error });
  }
};

export const buscarProdutosSimplesPorFornecedor = async (req: Request, res: Response) => {
  try {
    const { fornecedor_id } = req.body;

    const produtos = await ProdutosSupriService.buscarProdutosSimplesPorFornecedor(fornecedor_id);

    if (produtos.length === 0) {
      return res.status(404).send({ mensagem: 'Nenhum produto encontrado para este fornecedor.' });
    }

    return res.status(200).send({
      mensagem: 'Produtos encontrados com sucesso!',
      produtos
    });
  } catch (error: any) {
    if (error.tipo === 'Validacao') {
      return res.status(400).send({ mensagem: error.mensagem });
    }
    return res.status(500).send({ error: error.message || error });
  }
};
