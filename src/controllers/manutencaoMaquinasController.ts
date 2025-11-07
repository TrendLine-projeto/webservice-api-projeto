// src/controllers/manutencoesController.ts
import { Request, Response } from 'express';
import * as manutencoesService from '../service/manutencao_maquinas/manutencaoMaquinas';
import { ManutencaoBase, PaginacaoParams } from '../types/maquinas/manutencao_maquinas';

export const criarManutencao = async (req: Request<{}, {}, ManutencaoBase>, res: Response) => {
  try {
    const criado = await manutencoesService.criar(req.body);
    return res.status(201).send({ mensagem: 'Manutenção criada com sucesso!', criado });
  } catch (error: any) {
    const status = error?.tipo === 'Validacao' ? 400 : 500;
    return res.status(status).send({ mensagem: error?.mensagem ?? 'Erro interno', erro: error });
  }
};

export const listarManutencoes = async (req: Request<{}, {}, {}, PaginacaoParams>, res: Response) => {
  try {
    const data = await manutencoesService.listar(req.query);
    return res.status(200).send(data);
  } catch (error: any) {
    return res.status(500).send({ mensagem: 'Erro ao listar', erro: error });
  }
};

export const obterManutencao = async (req: Request<{ id: string }>, res: Response) => {
  try {
    const item = await manutencoesService.obter(Number(req.params.id));
    return res.status(200).send(item);
  } catch (error: any) {
    const status = error?.tipo === 'NaoEncontrado' ? 404 : 500;
    return res.status(status).send({ mensagem: error?.mensagem ?? 'Erro interno', erro: error });
  }
};

export const atualizarManutencao = async (req: Request<{ id: string }, {}, ManutencaoBase>, res: Response) => {
  try {
    const atualizado = await manutencoesService.atualizar(Number(req.params.id), req.body);
    return res.status(200).send({ mensagem: 'Manutenção atualizada com sucesso!', atualizado });
  } catch (error: any) {
    const status =
      error?.tipo === 'Validacao' ? 400 :
      error?.tipo === 'NaoEncontrado' ? 404 : 500;
    return res.status(status).send({ mensagem: error?.mensagem ?? 'Erro interno', erro: error });
  }
};

export const removerManutencao = async (req: Request<{ id: string }>, res: Response) => {
  try {
    const r = await manutencoesService.remover(Number(req.params.id));
    return res.status(200).send({ mensagem: 'Manutenção removida.', ...r });
  } catch (error: any) {
    const status = error?.tipo === 'NaoEncontrado' ? 404 : 500;
    return res.status(status).send({ mensagem: error?.mensagem ?? 'Erro interno', erro: error });
  }
};

export const fecharManutencao = async (req: Request<{ id: string }>, res: Response) => {
  try {
    const fechado = await manutencoesService.fechar(Number(req.params.id));
    return res.status(200).send({
      mensagem: 'Manutenção fechada e máquina marcada como ativa.',
      fechado
    });
  } catch (error: any) {
    const status = error?.tipo === 'NaoEncontrado' ? 404 : 500;
    return res.status(status).send({ mensagem: error?.mensagem ?? 'Erro interno', erro: error });
  }
};
