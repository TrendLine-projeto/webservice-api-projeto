import { Request, Response } from 'express';
import * as produtosProducaoService from '../service/produtos_producao/produtos_producaoBase';
import { ProdutoProducao } from '../types/ProdutoProducao/ProdutoProducao';
import dotenv from 'dotenv';

dotenv.config();

export const criarProduto = async (req: Request<{}, {}, ProdutoProducao>, res: Response) => {
    const entradaProduto = req.body;

    try {
        const produtoCriado = await produtosProducaoService.criarProduto(entradaProduto);

        return res.status(201).send({
            mensagem: 'Produto criado com sucesso!',
            produtoCriado
        });
    } catch (error: any) {
        if (error.tipo === 'LotePrincipal') {
            return res.status(404).send({ mensagem: error.mensagem });
        }

        return res.status(500).send({ erro: error });
    }
};

export const buscarProdutosPorCliente = async (req: Request, res: Response) => {
    const filtros = req.body;

    try {
        const resultado = await produtosProducaoService.buscarProdutosPorCliente(filtros);

        if (resultado.totalRegistros === 0) {
            return res.status(404).send({ mensagem: 'Nenhum produto encontrado para essa filial.' });
        }

        res.status(200).send({
            mensagem: 'Produtos encontrados com sucesso!',
            paginaAtual: resultado.paginaAtual,
            quantidadePorPagina: resultado.quantidadePorPagina,
            totalRegistros: resultado.totalRegistros,
            produtos: resultado.produtos
        });
    } catch (error: any) {
        if (error.tipo === 'Validacao') {
            return res.status(400).send({ mensagem: error.mensagem });
        }

        return res.status(500).send({ mensagem: 'Erro ao buscar produtos.', erro: error });
    }
};

export const buscarProdutoPorId = async (req: Request, res: Response) => {
    const idProdutoProducao = parseInt(req.params.id, 10);

    if (isNaN(idProdutoProducao)) {
        return res.status(400).send({ mensagem: 'ID do produto inválido' });
    }

    try {
        const produto = await produtosProducaoService.buscarProdutoPorId(idProdutoProducao);

        if (!produto) {
            return res.status(404).send({ mensagem: 'Produto não encontrado' });
        }

        return res.status(200).send({ produtoProducao: produto });
    } catch (error) {
        return res.status(500).send({ erro: error });
    }
};

export const atualizarProdutoPorId = async (req: Request, res: Response) => {
  const idParam = parseInt(req.params.id, 10);
  if (isNaN(idParam)) {
    return res.status(400).send({ mensagem: 'ID da URL inválido' });
  }

  const rawBody = (req.body && req.body.produtoProducao) ? req.body.produtoProducao : req.body || {};

  if (typeof rawBody.id === 'undefined') {
    return res.status(400).send({ mensagem: 'Body deve conter o campo id' });
  }

  const idBody = parseInt(String(rawBody.id), 10);
  if (isNaN(idBody)) {
    return res.status(400).send({ mensagem: 'ID do body inválido' });
  }
  if (idBody !== idParam) {
    return res.status(400).send({ mensagem: 'ID da URL e ID do body não conferem' });
  }

  try {
    const atualizado = await produtosProducaoService.atualizarProdutoPorId(idBody, rawBody);
    if (!atualizado) {
      return res.status(404).send({ mensagem: 'Produto não encontrado para atualização' });
    }
    return res.status(200).send({
      mensagem: 'Produto atualizado com sucesso',
      produtoProducao: atualizado,
    });
  } catch (error: any) {
    if (error?.tipo === 'Validacao') {
      return res.status(400).send({ mensagem: error.mensagem });
    }
    return res.status(500).send({ erro: error });
  }
};

export const deletarPorId = async (req: Request, res: Response) => {
    const id = parseInt(req.params.id, 10);

    if (isNaN(id)) {
        return res.status(400).send({ mensagem: 'ID do produto inválido' });
    }

    try {
        const deletado = await produtosProducaoService.deletarProdutoPorId(id);

        if (!deletado) {
            return res.status(404).send({ mensagem: 'Produto não encontrado' });
        }

        return res.status(200).send({ mensagem: 'Produto excluído com sucesso.' });
    } catch (error) {
        console.error('Erro ao excluir Produto:', error);
        return res.status(500).send({ erro: error });
    }
};

/*
export const reabrirLote = async (req: Request, res: Response) => {
    const { idEntrada_lotes } = req.body;

    if (!idEntrada_lotes) {
        return res.status(400).send({ mensagem: 'ID do lote é obrigatório' });
    }

    try {
        await lotesModel.reabrirLote(idEntrada_lotes);
        return res.status(200).send({ mensagem: 'Lote reaber com sucesso' });
    } catch (error) {
        return res.status(500).send({ erro: error });
    }
};

export const buscarLotePorId = async (req: Request, res: Response) => {
    const idLote = parseInt(req.params.id, 10);

    if (isNaN(idLote)) {
        return res.status(400).send({ mensagem: 'ID do lote inválido' });
    }

    try {
        const lote = await lotesModel.buscarLotePorId(idLote);

        if (!lote) {
            return res.status(404).send({ mensagem: 'Lote não encontrado' });
        }

        return res.status(200).send({ lote });
    } catch (error) {
        return res.status(500).send({ erro: error });
    }
};

export const deletarPorId = async (req: Request, res: Response) => {
  const idLote = parseInt(req.params.id, 10);

  if (isNaN(idLote)) {
    return res.status(400).send({ mensagem: 'ID do lote inválido' });
  }

  try {
    const lote = await lotesModel.buscarLotePorId(idLote);

    if (!lote) {
      return res.status(404).send({ mensagem: 'Lote não encontrado' });
    }

    if (!lote.loteFinalizado) {
      return res.status(400).send({ mensagem: 'Lote não finalizado, não pode ser excluído' });
    }

    const produtosNaoFinalizados = await lotesModel.verificarProdutosNaoFinalizados(idLote);

    if (produtosNaoFinalizados.length > 0) {
      return res.status(400).send({ mensagem: 'Existem produtos não finalizados neste lote' });
    }

    await lotesModel.deletarProdutosDoLote(idLote);
    await lotesModel.deletarLotePorId(idLote);

    return res.status(200).send({ mensagem: 'Lote e produtos excluídos com sucesso' });

  } catch (error) {
    console.error('Erro ao excluir lote:', error);
    return res.status(500).send({ erro: error });
  }
}; 
*/