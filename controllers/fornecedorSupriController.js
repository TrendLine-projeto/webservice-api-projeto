const FornecedorSupriModel = require('../models/fornecedorSupri');
require('dotenv').config();

exports.criarFornecedor = (req, res) => {
    const fornecedor = req.body;

    if (!fornecedor.razaoSocial || !fornecedor.cnpj || !fornecedor.cliente_id) {
        return res.status(400).send({ mensagem: 'Razão Social, CNPJ e Cliente ID são obrigatórios.' });
    }

    FornecedorSupriModel.criarFornecedor(fornecedor, (error, result) => {
        if (error) {
            return res.status(500).send({ error });
        }

        res.status(201).send({
            mensagem: 'Fornecedor de suprimentos criado com sucesso!',
            fornecedorCriado: {
                id: result.insertId,
                ...fornecedor
            }
        });
    });

};

exports.buscarFornecedoresPorCliente = (req, res) => {
    const filtros = req.body;

    if (!filtros.cliente_id) {
        return res.status(400).send({ mensagem: 'Cliente ID é obrigatório.' });
    }

    FornecedorSupriModel.buscarFornecedoresPorCliente(filtros, (error, resultado) => {
        if (error) {
            return res.status(500).send({ error });
        }

        if (resultado.totalRegistros === 0) {
            return res.status(404).send({ mensagem: 'Nenhum fornecedor encontrado para esse cliente.' });
        }

        res.status(200).send({
            mensagem: 'Fornecedores encontrados com sucesso!',
            paginaAtual: filtros.pagina,
            quantidadePorPagina: filtros.quantidadePorPagina,
            totalRegistros: resultado.totalRegistros,
            fornecedores: resultado.fornecedores
        });
    });
};

exports.buscarFornecedoresSimplesPorCliente = (req, res) => {
    const { cliente_id } = req.body;

    if (!cliente_id) {
        return res.status(400).send({ mensagem: 'Cliente ID é obrigatório.' });
    }

    FornecedorSupriModel.buscarFornecedoresSimplesPorCliente(cliente_id, (error, fornecedores) => {
        if (error) {
            return res.status(500).send({ error });
        }

        if (fornecedores.length === 0) {
            return res.status(404).send({ mensagem: 'Nenhum fornecedor encontrado para este cliente.' });
        }

        res.status(200).send({
            mensagem: 'Fornecedores encontrados com sucesso!',
            fornecedores
        });
    });
};
