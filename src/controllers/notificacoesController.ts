import { Request, Response } from 'express';
import * as notificacoesService from '../service/notificacoes/notificacoes';
import { NotificacaoBase, PaginacaoParams } from '../types/notificacoes/notificacoes';

export const criarNotificacao = async (req: Request<{}, {}, NotificacaoBase>, res: Response) => {
  try {
    const criado = await notificacoesService.criar(req.body);
    return res.status(201).send({ mensagem: 'Notificacao criada com sucesso!', criado });
  } catch (error: any) {
    const status = error?.tipo === 'Validacao' ? 400 : 500;
    return res.status(status).send({ mensagem: error?.mensagem ?? 'Erro interno', erro: error });
  }
};

export const listarNotificacoes = async (req: Request<{}, {}, {}, PaginacaoParams>, res: Response) => {
  try {
    const data = await notificacoesService.listar(req.query);
    return res.status(200).send(data);
  } catch (error: any) {
    return res.status(500).send({ mensagem: 'Erro ao listar', erro: error });
  }
};

export const obterNotificacao = async (req: Request<{ id: string }>, res: Response) => {
  try {
    const item = await notificacoesService.obter(Number(req.params.id));
    return res.status(200).send(item);
  } catch (error: any) {
    const status = error?.tipo === 'NaoEncontrado' ? 404 : 500;
    return res.status(status).send({ mensagem: error?.mensagem ?? 'Erro interno', erro: error });
  }
};

export const atualizarNotificacao = async (
  req: Request<{ id: string }, {}, NotificacaoBase>,
  res: Response
) => {
  try {
    const atualizado = await notificacoesService.atualizar(Number(req.params.id), req.body);
    return res.status(200).send({ mensagem: 'Notificacao atualizada com sucesso!', atualizado });
  } catch (error: any) {
    const status =
      error?.tipo === 'Validacao' ? 400 :
      error?.tipo === 'NaoEncontrado' ? 404 : 500;
    return res.status(status).send({ mensagem: error?.mensagem ?? 'Erro interno', erro: error });
  }
};

export const removerNotificacao = async (req: Request<{ id: string }>, res: Response) => {
  try {
    const r = await notificacoesService.remover(Number(req.params.id));
    return res.status(200).send({ mensagem: 'Notificacao removida.', ...r });
  } catch (error: any) {
    const status = error?.tipo === 'NaoEncontrado' ? 404 : 500;
    return res.status(status).send({ mensagem: error?.mensagem ?? 'Erro interno', erro: error });
  }
};
