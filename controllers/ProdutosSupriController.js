const ProdutosSupriModel = require('../models/produtosSupri');
require('dotenv').config();

exports.criarProduto = (req, res) => {
    const produto = req.body;

    if (!produto.nomeProduto || !produto.descricao || !produto.fornecedor_id) {
        return res.status(400).send({ mensagem: 'nomeProduto, descricao e fornecedor_id são obrigatórios.' });
    }

    ProdutosSupriModel.criarProduto(produto, (error, result) => {
        if (error) {
            if (error.tipo === 'FornecedorNaoEncontrado') {
                return res.status(404).send({ mensagem: error.mensagem });
            }
            return res.status(500).send({ error });
        }

        res.status(201).send({
            mensagem: 'Produto de suprimentos criado com sucesso!',
            produtoCriado: {
                id: result.insertId,
                ...produto
            }
        });
    });
};

exports.buscarProdutosPorCliente = (req, res) => {
    const filtros = req.body;

    if (!filtros.cliente_id) {
        return res.status(400).send({ mensagem: 'Cliente ID é obrigatório.' });
    }

    ProdutosSupriModel.buscarProdutosPorCliente(filtros, (error, resultado) => {
        if (error) {
            return res.status(500).send({ error });
        }

        if (resultado.totalRegistros === 0) {
            return res.status(404).send({ mensagem: 'Nenhum produto encontrado para esse cliente.' });
        }

        res.status(200).send({
            mensagem: 'Produtos encontrados com sucesso!',
            paginaAtual: filtros.pagina,
            quantidadePorPagina: filtros.quantidadePorPagina,
            totalRegistros: resultado.totalRegistros,
            produtos: resultado.produtos
        });
    });
};

exports.buscarProdutosSimplesPorFornecedor = (req, res) => {
    const { fornecedor_id } = req.body;

    if (!fornecedor_id) {
        return res.status(400).send({ mensagem: 'Fornecedor ID é obrigatório.' });
    }

    ProdutosSupriModel.buscarProdutosSimplesPorFornecedor(fornecedor_id, (error, produtos) => {
        if (error) {
            return res.status(500).send({ error });
        }

        if (produtos.length === 0) {
            return res.status(404).send({ mensagem: 'Nenhum produto encontrado para este fornecedor.' });
        }

        res.status(200).send({
            mensagem: 'Produtos encontrados com sucesso!',
            produtos
        });
    });
};
