import { Request, Response } from 'express';
import * as lotesService from '../service/lotes/lotesBase';
import { EntradaDeLote } from '../types/lotes/EntradaDeLote';
import dotenv from 'dotenv';

dotenv.config();

export const criarLote = async (req: Request<{}, {}, EntradaDeLote>, res: Response) => {
    const entradaDeLote = req.body;

    if (!entradaDeLote.idFilial) {
        return res.status(400).send({ mensagem: 'Identificação da filial é obrigatória' });
    }

    try {
        const loteCriado = await lotesService.criarLote(entradaDeLote);

        return res.status(201).send({
            mensagem: 'Entrada de lote criada com sucesso!',
            loteCadastrado: loteCriado
        });
    } catch (error: any) {
        if (error.tipo === 'FilialNaoEncontrada') {
            return res.status(404).send({ mensagem: error.mensagem });
        }
        return res.status(500).send({ erro: error });
    }
};

export const buscarLotesPorCliente = async (req: Request, res: Response) => {
  try {
    const filtros = req.body;

    const resultado = await lotesService.buscarLotesPorCliente(filtros);

    if (resultado.totalRegistros === 0) {
      return res.status(404).send({ mensagem: 'Nenhum lote encontrado para essa filial.' });
    }

    return res.status(200).send({
      mensagem: 'Lotes encontrados com sucesso!',
      paginaAtual: filtros.pagina,
      quantidadePorPagina: filtros.quantidadePorPagina,
      totalRegistros: resultado.totalRegistros,
      lotes: resultado.lotes
    });
  } catch (error: any) {
    const status = error.status || 500;
    return res.status(status).send({ erro: error.mensagem || error });
  }
};

export const encerrarLote = async (req: Request, res: Response) => {
  const { idEntrada_lotes } = req.body;

  try {
    await lotesService.encerrarLote(idEntrada_lotes);
    return res.status(200).send({ mensagem: 'Lote encerrado com sucesso' });
  } catch (error: any) {
    const status = error.status || 500;
    return res.status(status).send({ erro: error.mensagem || error });
  }
};

export const reabrirLote = async (req: Request, res: Response) => {
  const { idEntrada_lotes } = req.body;

  try {
    await lotesService.reabrirLote(idEntrada_lotes);
    return res.status(200).send({ mensagem: 'Lote reaberto com sucesso' });
  } catch (error: any) {
    const status = error.status || 500;
    return res.status(status).send({ erro: error.mensagem || error });
  }
};

export const buscarLotePorId = async (req: Request, res: Response) => {
  const idLote = parseInt(req.params.id, 10);

  try {
    const lote = await lotesService.buscarLotePorId(idLote);
    return res.status(200).send({ lote });
  } catch (error: any) {
    const status = error.status || 500;
    return res.status(status).send({ mensagem: error.mensagem || 'Erro interno no servidor' });
  }
};

export const deletarPorId = async (req: Request, res: Response) => {
  const idLote = parseInt(req.params.id, 10);

  try {
    await lotesService.deletarLoteComProdutos(idLote);
    return res.status(200).send({ mensagem: 'Lote e produtos excluídos com sucesso' });
  } catch (error: any) {
    const status = error.status || 500;
    return res.status(status).send({ mensagem: error.mensagem || 'Erro ao excluir lote' });
  }
};