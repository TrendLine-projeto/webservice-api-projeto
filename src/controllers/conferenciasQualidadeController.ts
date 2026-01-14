import { Request, Response } from 'express';
import * as conferenciasQualidadeService from '../service/conferencias_qualidade/conferencias_qualidade';
import {
  ConferenciaQualidadeBase,
  ConferenciaQualidadeFiltro
} from '../types/qualidade/ConferenciaQualidade';

export const criarConferencia = async (
  req: Request<{}, {}, ConferenciaQualidadeBase>,
  res: Response
) => {
  try {
    const criado = await conferenciasQualidadeService.criar(req.body);
    return res.status(201).send({
      mensagem: 'Conferencia de qualidade criada com sucesso!',
      criado
    });
  } catch (error: any) {
    const status =
      error?.tipo === 'Validacao' ? 400 :
      error?.tipo === 'ProdutoNaoEncontrado' ? 404 :
      error?.tipo === 'ConferenciaFinalizada' ? 409 : 500;
    return res.status(status).send({ mensagem: error?.mensagem ?? 'Erro interno', erro: error });
  }
};

export const listarConferencias = async (
  req: Request<{}, {}, {}, ConferenciaQualidadeFiltro>,
  res: Response
) => {
  try {
    const data = await conferenciasQualidadeService.listar(req.query);
    return res.status(200).send(data);
  } catch (error: any) {
    const status = error?.tipo === 'Validacao' ? 400 : 500;
    return res.status(status).send({ mensagem: error?.mensagem ?? 'Erro ao listar', erro: error });
  }
};

export const obterConferencia = async (req: Request<{ id: string }>, res: Response) => {
  try {
    const item = await conferenciasQualidadeService.obter(Number(req.params.id));
    return res.status(200).send(item);
  } catch (error: any) {
    const status = error?.tipo === 'NaoEncontrado' ? 404 : 500;
    return res.status(status).send({ mensagem: error?.mensagem ?? 'Erro interno', erro: error });
  }
};

export const atualizarConferencia = async (
  req: Request<{ id: string }, {}, Partial<ConferenciaQualidadeBase>>,
  res: Response
) => {
  try {
    const atualizado = await conferenciasQualidadeService.atualizar(Number(req.params.id), req.body);
    return res.status(200).send({
      mensagem: 'Conferencia de qualidade atualizada com sucesso!',
      atualizado
    });
  } catch (error: any) {
    const status =
      error?.tipo === 'Validacao' ? 400 :
      error?.tipo === 'NaoEncontrado' ? 404 :
      error?.tipo === 'ProdutoNaoEncontrado' ? 404 : 500;
    return res.status(status).send({ mensagem: error?.mensagem ?? 'Erro interno', erro: error });
  }
};

export const removerConferencia = async (req: Request<{ id: string }>, res: Response) => {
  try {
    const resultado = await conferenciasQualidadeService.remover(Number(req.params.id));
    return res.status(200).send({ mensagem: 'Conferencia de qualidade removida.', ...resultado });
  } catch (error: any) {
    const status = error?.tipo === 'NaoEncontrado' ? 404 : 500;
    return res.status(status).send({ mensagem: error?.mensagem ?? 'Erro interno', erro: error });
  }
};
