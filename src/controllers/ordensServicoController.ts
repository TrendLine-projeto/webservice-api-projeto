import { Request, Response } from 'express';
import * as ordensServicoService from '../service/ordens_servico/ordensServico';
import { OrdemServicoBase, PaginacaoParams } from '../types/ordensServico/ordensServico';

export const criarOrdem = async (req: Request<{}, {}, OrdemServicoBase>, res: Response) => {
  try {
    const criado = await ordensServicoService.criar(req.body);
    return res.status(201).send({ mensagem: 'Ordem de servico criada com sucesso!', criado });
  } catch (error: any) {
    const status = error?.tipo === 'Validacao' ? 400 : 500;
    return res.status(status).send({ mensagem: error?.mensagem ?? 'Erro interno', erro: error });
  }
};

export const listarOrdens = async (req: Request<{}, {}, {}, PaginacaoParams>, res: Response) => {
  try {
    const data = await ordensServicoService.listar(req.query);
    return res.status(200).send(data);
  } catch (error: any) {
    return res.status(500).send({ mensagem: 'Erro ao listar', erro: error });
  }
};

export const obterOrdem = async (req: Request<{ id: string }>, res: Response) => {
  try {
    const item = await ordensServicoService.obter(Number(req.params.id));
    return res.status(200).send(item);
  } catch (error: any) {
    const status = error?.tipo === 'NaoEncontrado' ? 404 : 500;
    return res.status(status).send({ mensagem: error?.mensagem ?? 'Erro interno', erro: error });
  }
};

export const atualizarOrdem = async (req: Request<{ id: string }, {}, OrdemServicoBase>, res: Response) => {
  try {
    const atualizado = await ordensServicoService.atualizar(Number(req.params.id), req.body);
    return res.status(200).send({ mensagem: 'Ordem de servico atualizada com sucesso!', atualizado });
  } catch (error: any) {
    const status =
      error?.tipo === 'Validacao' ? 400 :
      error?.tipo === 'NaoEncontrado' ? 404 : 500;
    return res.status(status).send({ mensagem: error?.mensagem ?? 'Erro interno', erro: error });
  }
};

export const removerOrdem = async (req: Request<{ id: string }>, res: Response) => {
  try {
    const r = await ordensServicoService.remover(Number(req.params.id));
    return res.status(200).send({ mensagem: 'Ordem de servico removida.', ...r });
  } catch (error: any) {
    const status = error?.tipo === 'NaoEncontrado' ? 404 : 500;
    return res.status(status).send({ mensagem: error?.mensagem ?? 'Erro interno', erro: error });
  }
};

export const finalizarOrdem = async (
  req: Request<{ id: string }, {}, { finalizado?: number; descricaoFinalizado: string; dataFinalizado?: string | null; }>,
  res: Response
) => {
  try {
    const finalizado = await ordensServicoService.finalizar(Number(req.params.id), req.body);
    return res.status(200).send({ mensagem: 'Ordem de servico finalizada com sucesso!', finalizado });
  } catch (error: any) {
    const status =
      error?.tipo === 'Validacao' ? 400 :
      error?.tipo === 'NaoEncontrado' ? 404 : 500;
    return res.status(status).send({ mensagem: error?.mensagem ?? 'Erro interno', erro: error });
  }
};
