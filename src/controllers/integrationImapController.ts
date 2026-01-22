import { Request, Response } from 'express';
import * as imapService from '../service/integration/imapConfig';
import { testarConexaoImap } from '../service/integration/imapTest';

export const criarConfiguracao = async (req: Request, res: Response) => {
  try {
    const config = await imapService.criarConfiguracao(req.body);
    return res.status(201).send({
      mensagem: 'Configuracao criada com sucesso.',
      configuracao: config,
    });
  } catch (error: any) {
    if (error.tipo === 'Validacao') {
      return res.status(400).send({ mensagem: error.mensagem });
    }
    return res.status(500).send({ mensagem: 'Erro ao criar configuracao.', error });
  }
};

export const buscarPorId = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (!id || Number.isNaN(id)) {
      return res.status(400).send({ mensagem: 'ID invalido.' });
    }

    const config = await imapService.buscarPorId(id);
    return res.status(200).send({
      mensagem: 'Configuracao encontrada.',
      configuracao: config,
    });
  } catch (error: any) {
    if (error.tipo === 'NaoEncontrado') {
      return res.status(404).send({ mensagem: error.mensagem });
    }
    return res.status(500).send({ mensagem: 'Erro ao buscar configuracao.', error });
  }
};

export const buscarPorCliente = async (req: Request, res: Response) => {
  try {
    const clienteId = Number(req.body.cliente_id);
    if (!clienteId || Number.isNaN(clienteId)) {
      return res.status(400).send({ mensagem: 'cliente_id invalido.' });
    }

    const resultado = await imapService.buscarPorCliente(clienteId);
    return res.status(200).send({
      mensagem: 'Configuracoes encontradas.',
      ...resultado,
    });
  } catch (error: any) {
    if (error.tipo === 'Validacao') {
      return res.status(400).send({ mensagem: error.mensagem });
    }
    return res.status(500).send({ mensagem: 'Erro ao buscar configuracoes.', error });
  }
};

export const buscarAtivaPorCliente = async (req: Request, res: Response) => {
  try {
    const clienteId = Number(req.params.cliente_id);
    if (!clienteId || Number.isNaN(clienteId)) {
      return res.status(400).send({ mensagem: 'cliente_id invalido.' });
    }

    const config = await imapService.buscarAtivaPorCliente(clienteId);
    return res.status(200).send({
      mensagem: 'Configuracao ativa encontrada.',
      configuracao: config,
    });
  } catch (error: any) {
    if (error.tipo === 'NaoEncontrado') {
      return res.status(404).send({ mensagem: error.mensagem });
    }
    return res.status(500).send({ mensagem: 'Erro ao buscar configuracao ativa.', error });
  }
};

export const atualizarPorId = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (!id || Number.isNaN(id)) {
      return res.status(400).send({ mensagem: 'ID invalido.' });
    }

    const resultado = await imapService.atualizarPorId(id, req.body);
    return res.status(200).send({
      mensagem: 'Configuracao atualizada.',
      configuracao: resultado,
    });
  } catch (error: any) {
    if (error.tipo === 'Validacao') {
      return res.status(400).send({ mensagem: error.mensagem });
    }
    if (error.tipo === 'NaoEncontrado') {
      return res.status(404).send({ mensagem: error.mensagem });
    }
    return res.status(500).send({ mensagem: 'Erro ao atualizar configuracao.', error });
  }
};

export const deletarPorId = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (!id || Number.isNaN(id)) {
      return res.status(400).send({ mensagem: 'ID invalido.' });
    }

    const resultado = await imapService.deletarPorId(id);
    return res.status(200).send(resultado);
  } catch (error: any) {
    if (error.tipo === 'NaoEncontrado') {
      return res.status(404).send({ mensagem: error.mensagem });
    }
    return res.status(500).send({ mensagem: 'Erro ao deletar configuracao.', error });
  }
};

export const testarConexao = async (req: Request, res: Response) => {
  try {
    const resultado = await testarConexaoImap(req.body);
    return res.status(200).send({
      mensagem: 'Conexao IMAP OK.',
      detalhes: resultado,
    });
  } catch (error: any) {
    if (error.tipo === 'Validacao') {
      return res.status(400).send({ mensagem: error.mensagem });
    }
    return res.status(500).send({ mensagem: error?.mensagem || 'Erro ao testar conexao IMAP.', error });
  }
};
