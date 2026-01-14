import { Request, Response } from 'express';
import * as conferenciaQualidadeDefeitosService from '../service/conferencia_qualidade_defeitos/conferencia_qualidade_defeitos';
import {
  ConferenciaQualidadeDefeitoBase,
  ConferenciaQualidadeDefeitoFiltro
} from '../types/qualidade/ConferenciaQualidadeDefeito';

export const criarDefeito = async (
  req: Request<{}, {}, ConferenciaQualidadeDefeitoBase>,
  res: Response
) => {
  try {
    const criado = await conferenciaQualidadeDefeitosService.criar(req.body);
    return res.status(201).send({
      mensagem: 'Defeito criado com sucesso!',
      criado
    });
  } catch (error: any) {
    const status =
      error?.tipo === 'Validacao' ? 400 :
      error?.tipo === 'ConferenciaNaoEncontrada' ? 404 : 500;
    return res.status(status).send({ mensagem: error?.mensagem ?? 'Erro interno', erro: error });
  }
};

export const listarDefeitos = async (
  req: Request<{}, {}, {}, ConferenciaQualidadeDefeitoFiltro>,
  res: Response
) => {
  try {
    const data = await conferenciaQualidadeDefeitosService.listar(req.query);
    return res.status(200).send(data);
  } catch (error: any) {
    const status = error?.tipo === 'Validacao' ? 400 : 500;
    return res.status(status).send({ mensagem: error?.mensagem ?? 'Erro ao listar', erro: error });
  }
};

export const obterDefeito = async (req: Request<{ id: string }>, res: Response) => {
  try {
    const item = await conferenciaQualidadeDefeitosService.obter(Number(req.params.id));
    return res.status(200).send(item);
  } catch (error: any) {
    const status = error?.tipo === 'NaoEncontrado' ? 404 : 500;
    return res.status(status).send({ mensagem: error?.mensagem ?? 'Erro interno', erro: error });
  }
};

export const atualizarDefeito = async (
  req: Request<{ id: string }, {}, ConferenciaQualidadeDefeitoBase>,
  res: Response
) => {
  try {
    const atualizado = await conferenciaQualidadeDefeitosService.atualizar(Number(req.params.id), req.body);
    return res.status(200).send({
      mensagem: 'Defeito atualizado com sucesso!',
      atualizado
    });
  } catch (error: any) {
    const status =
      error?.tipo === 'Validacao' ? 400 :
      error?.tipo === 'ConferenciaNaoEncontrada' ? 404 :
      error?.tipo === 'NaoEncontrado' ? 404 : 500;
    return res.status(status).send({ mensagem: error?.mensagem ?? 'Erro interno', erro: error });
  }
};

export const removerDefeito = async (req: Request<{ id: string }>, res: Response) => {
  try {
    const resultado = await conferenciaQualidadeDefeitosService.remover(Number(req.params.id));
    return res.status(200).send({ mensagem: 'Defeito removido.', ...resultado });
  } catch (error: any) {
    const status = error?.tipo === 'NaoEncontrado' ? 404 : 500;
    return res.status(status).send({ mensagem: error?.mensagem ?? 'Erro interno', erro: error });
  }
};
