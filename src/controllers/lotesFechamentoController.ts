import { Request, Response } from 'express';
import * as lotesFechamentoService from '../service/lotes_fechamento/lotes_fechamento';
import {
  LoteFechamentoBase,
  LoteFechamentoFiltro
} from '../types/lotes/LoteFechamento';

export const criarFechamento = async (
  req: Request<{}, {}, LoteFechamentoBase>,
  res: Response
) => {
  try {
    const criado = await lotesFechamentoService.criar(req.body);
    return res.status(201).send({
      mensagem: 'Fechamento criado com sucesso!',
      fechamentoCriado: criado
    });
  } catch (error: any) {
    if (error?.tipo === 'Validacao') {
      return res.status(400).send({ mensagem: error.mensagem });
    }
    if (error?.tipo === 'LoteNaoEncontrado') {
      return res.status(404).send({ mensagem: error.mensagem });
    }
    if (error?.tipo === 'LoteJaEncerrado') {
      return res.status(409).send({ mensagem: error.mensagem });
    }
    return res.status(500).send({ mensagem: 'Erro interno', erro: error });
  }
};

export const buscarFechamentos = async (
  req: Request<{}, {}, LoteFechamentoFiltro>,
  res: Response
) => {
  try {
    const filtros = req.body;
    const resultado = await lotesFechamentoService.listar(filtros);

    if (resultado.total === 0) {
      return res.status(404).send({ mensagem: 'Nenhum fechamento encontrado.' });
    }

    return res.status(200).send({
      mensagem: 'Fechamentos encontrados com sucesso!',
      paginaAtual: resultado.pagina,
      quantidadePorPagina: resultado.quantidadePorPagina,
      totalRegistros: resultado.total,
      fechamentos: resultado.itens
    });
  } catch (error: any) {
    if (error?.tipo === 'Validacao') {
      return res.status(400).send({ mensagem: error.mensagem });
    }
    return res.status(500).send({ mensagem: 'Erro interno', erro: error });
  }
};

export const buscarFechamentoPorId = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).send({ mensagem: 'ID invalido.' });
    }

    const fechamento = await lotesFechamentoService.obter(id);
    return res.status(200).send({
      mensagem: 'Fechamento encontrado com sucesso!',
      fechamento
    });
  } catch (error: any) {
    if (error?.tipo === 'NaoEncontrado') {
      return res.status(404).send({ mensagem: error.mensagem });
    }
    return res.status(500).send({ mensagem: 'Erro interno', erro: error });
  }
};

export const editarFechamento = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).send({ mensagem: 'ID invalido.' });
    }

    const atualizado = await lotesFechamentoService.atualizar(id, req.body);
    return res.status(200).send({
      mensagem: 'Fechamento atualizado com sucesso!',
      fechamento: atualizado
    });
  } catch (error: any) {
    if (error?.tipo === 'Validacao') {
      return res.status(400).send({ mensagem: error.mensagem });
    }
    if (error?.tipo === 'NaoEncontrado' || error?.tipo === 'LoteNaoEncontrado') {
      return res.status(404).send({ mensagem: error.mensagem });
    }
    if (error?.tipo === 'LoteJaEncerrado') {
      return res.status(409).send({ mensagem: error.mensagem });
    }
    return res.status(500).send({ mensagem: 'Erro interno', erro: error });
  }
};

export const deletarFechamento = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).send({ mensagem: 'ID invalido.' });
    }

    const resultado = await lotesFechamentoService.remover(id);
    return res.status(200).send({
      mensagem: 'Fechamento removido com sucesso!',
      ...resultado
    });
  } catch (error: any) {
    if (error?.tipo === 'NaoEncontrado') {
      return res.status(404).send({ mensagem: error.mensagem });
    }
    return res.status(500).send({ mensagem: 'Erro interno', erro: error });
  }
};
