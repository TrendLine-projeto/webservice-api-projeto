import { Request, Response } from 'express';
import * as FornecedorProducaoModel from '../service/fornecedor_producao/fornecedor_producaoBase';
import dotenv from 'dotenv';

dotenv.config();


export const criarFornecedor = async (req: Request, res: Response) => {
    try {
        const fornecedorCriado = await FornecedorProducaoModel.criarFornecedor(req.body);

        return res.status(201).send({
            mensagem: 'Fornecedor de produção criado com sucesso!',
            fornecedorCriado
        });
    } catch (error: any) {
        if (error.tipo === 'Validacao') {
            return res.status(400).send({ mensagem: error.mensagem });
        }

        if (error.tipo === 'ClienteNaoEncontrado') {
            return res.status(404).send({ mensagem: error.mensagem });
        }

        return res.status(500).send({ mensagem: 'Erro interno ao criar fornecedor.', error });
    }
};

export const buscarFornecedoresPorCliente = async (req: Request, res: Response) => {
    const filtros = req.body;

    if (!filtros.cliente_id) {
        return res.status(400).send({ mensagem: 'Cliente ID é obrigatório.' });
    }

    try {
        const resultado = await FornecedorProducaoModel.buscarFornecedoresPorCliente(filtros);

        if (resultado.totalRegistros === 0) {
            return res.status(404).send({ mensagem: 'Nenhum fornecedor encontrado para esse cliente.' });
        }

        res.status(200).send({
            mensagem: 'Fornecedores encontrados com sucesso!',
            paginaAtual: filtros.pagina || 1,
            quantidadePorPagina: filtros.quantidadePorPagina || 10,
            totalRegistros: resultado.totalRegistros,
            fornecedores: resultado.fornecedores
        });
    } catch (error) {
        res.status(500).send({ mensagem: 'Erro ao buscar fornecedores.', error });
    }
};

export const buscarFornecedoresSimplesPorCliente = async (req: Request, res: Response) => {
    try {
        const fornecedores = await FornecedorProducaoModel.buscarFornecedoresSimplesPorCliente(req.body);

        if (fornecedores.length === 0) {
            return res.status(404).send({ mensagem: 'Nenhum fornecedor encontrado para este cliente.' });
        }

        res.status(200).send({
            mensagem: 'Fornecedores encontrados com sucesso!',
            fornecedores
        });
    } catch (error: any) {
        if (error.tipo === 'Validacao') {
            return res.status(400).send({ mensagem: error.mensagem });
        }

        return res.status(500).send({ mensagem: 'Erro ao buscar fornecedores simples.', error });
    }
};