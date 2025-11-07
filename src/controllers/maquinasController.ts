// src/controllers/maquinasController.ts
import { Request, Response } from 'express';
import * as maquinasService from '../service/maquinas/maquinas';
import { MaquinaBase, PaginacaoParams, DatasManutencaoBody} from '../types/maquinas/maquinas';

export const criarMaquina = async (req: Request<{}, {}, MaquinaBase>, res: Response) => {
  try {
    const criado = await maquinasService.criar(req.body);
    return res.status(201).send({ mensagem: 'Máquina criada com sucesso!', criado });
  } catch (error: any) {
    const status = error?.tipo === 'Validacao' ? 400 : 500;
    return res.status(status).send({ mensagem: error?.mensagem ?? 'Erro interno', erro: error });
  }
};

export const listarMaquinas = async (req: Request<{}, {}, {}, PaginacaoParams>, res: Response) => {
  try {
    const data = await maquinasService.listar(req.query);
    return res.status(200).send(data);
  } catch (error: any) {
    return res.status(500).send({ mensagem: 'Erro ao listar', erro: error });
  }
};

export const obterMaquina = async (req: Request<{ id: string }>, res: Response) => {
  try {
    const item = await maquinasService.obter(Number(req.params.id));
    return res.status(200).send(item);
  } catch (error: any) {
    const status = error?.tipo === 'NaoEncontrado' ? 404 : 500;
    return res.status(status).send({ mensagem: error?.mensagem ?? 'Erro interno', erro: error });
  }
};

export const atualizarMaquina = async (req: Request<{ id: string }, {}, MaquinaBase>, res: Response) => {
  try {
    const atualizado = await maquinasService.atualizar(Number(req.params.id), req.body);
    return res.status(200).send({ mensagem: 'Máquina atualizada com sucesso!', atualizado });
  } catch (error: any) {
    const status = error?.tipo === 'Validacao' ? 400 :
                   error?.tipo === 'NaoEncontrado' ? 404 : 500;
    return res.status(status).send({ mensagem: error?.mensagem ?? 'Erro interno', erro: error });
  }
};

export const removerMaquina = async (req: Request<{ id: string }>, res: Response) => {
  try {
    const r = await maquinasService.remover(Number(req.params.id));
    return res.status(200).send({ mensagem: 'Máquina removida.', ...r });
  } catch (error: any) {
    const status = error?.tipo === 'NaoEncontrado' ? 404 : 500;
    return res.status(status).send({ mensagem: error?.mensagem ?? 'Erro interno', erro: error });
  }
};
