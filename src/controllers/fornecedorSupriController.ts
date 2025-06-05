import { Request, Response } from 'express';
import * as FornecedorSupriModel from '../models/fornecedorSupri';
import * as FornecedorSupriService from '../service/fornecedor_suprimentos/fornecedor_suprimentosBase';
import dotenv from 'dotenv';

dotenv.config();

export const criarFornecedor = async (req: Request, res: Response) => {
  try {
    const fornecedorCriado = await FornecedorSupriService.criarFornecedor(req.body);

    return res.status(201).send({
      mensagem: 'Fornecedor de suprimentos criado com sucesso!',
      fornecedorCriado
    });
  } catch (error: any) {
    if (error.tipo === 'Validacao') {
      return res.status(400).send({ mensagem: error.mensagem });
    }

    if (error.tipo === 'ClienteNaoEncontrado') {
      return res.status(404).send({ mensagem: error.mensagem });
    }

    return res.status(500).send({ error: error.message || error });
  }
};

export const buscarFornecedoresPorCliente = async (req: Request, res: Response) => {
  try {
    const filtros = req.body;

    const resultado = await FornecedorSupriService.buscarFornecedoresPorCliente(filtros);

    if (resultado.totalRegistros === 0) {
      return res.status(404).send({ mensagem: 'Nenhum fornecedor encontrado para esse cliente.' });
    }

    return res.status(200).send({
      mensagem: 'Fornecedores encontrados com sucesso!',
      paginaAtual: filtros.pagina,
      quantidadePorPagina: filtros.quantidadePorPagina,
      totalRegistros: resultado.totalRegistros,
      fornecedores: resultado.fornecedores
    });
  } catch (error: any) {
    if (error.tipo === 'Validacao') {
      return res.status(400).send({ mensagem: error.mensagem });
    }
    return res.status(500).send({ error: error.message || error });
  }
};

export const buscarFornecedoresSimplesPorCliente = async (req: Request, res: Response) => {
  try {
    const { cliente_id } = req.body;

    const fornecedores = await FornecedorSupriService.buscarFornecedoresSimplesPorCliente(cliente_id);

    if (fornecedores.length === 0) {
      return res.status(404).send({ mensagem: 'Nenhum fornecedor encontrado para este cliente.' });
    }

    return res.status(200).send({
      mensagem: 'Fornecedores encontrados com sucesso!',
      fornecedores
    });
  } catch (error: any) {
    if (error.tipo === 'Validacao') {
      return res.status(400).send({ mensagem: error.mensagem });
    }
    return res.status(500).send({ error: error.message || error });
  }
};

export const buscarFornecedorPorId = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    if (!id || isNaN(id)) {
      return res.status(400).send({ mensagem: 'ID inválido.' });
    }

    const resultado = await FornecedorSupriService.buscarFornecedorPorId(id);

    if (!resultado || resultado.totalRegistros === 0) {
      return res.status(404).send({ mensagem: 'Nenhum fornecedor encontrado' });
    }

    return res.status(200).send({
      mensagem: 'Fornecedor encontrado com sucesso!',
      fornecedor: resultado.fornecedor
    });
  } catch (error: any) {
    if (error.tipo === 'Validacao') {
      return res.status(400).send({ mensagem: error.mensagem });
    }
    return res.status(500).send({ error: error.message || error });
  }
};
