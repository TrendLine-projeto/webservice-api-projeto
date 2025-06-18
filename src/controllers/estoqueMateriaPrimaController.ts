import { Request, Response } from 'express';
import * as EstoqueMateriaPrimaModel from '../service/estoque_materiaPrima/estoque_materiaPrimaBase';
import dotenv from 'dotenv';

dotenv.config();

export const estoquemateriaprimaPorId = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    if (!id || isNaN(id)) {
      return res.status(400).send({ mensagem: 'ID inválido.' });
    }

    const resultado = await EstoqueMateriaPrimaModel.estoquemateriaprimaPorId(id);

    if (!resultado || resultado.totalRegistros === 0) {
      return res.status(404).send({ mensagem: 'Nenhuma materia prima encontrada encontrado' });
    }

    return res.status(200).send({
      mensagem: 'Materia prima encontrado com sucesso!',
      materiaPrima: resultado.materiaPrima
    });
  } catch (error: any) {
    if (error.tipo === 'Validacao') {
      return res.status(400).send({ mensagem: error.mensagem });
    }
    return res.status(500).send({ error: error.message || error });
  }
};

export const criarMateriaPrima = async (req: Request, res: Response) => {
  try {
    const materiaPrimaCriada = await EstoqueMateriaPrimaModel.criarMateriaPrima(req.body);

    return res.status(201).send({
      mensagem: 'Materia prima criado com sucesso!',
      materiaPrimaCriada
    });
  } catch (error: any) {
    if (error.tipo === 'Validacao') {
      return res.status(400).send({ mensagem: error.mensagem });
    }

    if (error.tipo === 'FornecedorsuprimentoNaoEncontrado') {
      return res.status(404).send({ mensagem: error.mensagem });
    }

    return res.status(500).send({ mensagem: 'Erro interno ao criar fornecedor.', error });
  }
};

export const buscarMateriaisPorFornecedor = async (req: Request, res: Response) => {
  const filtros = req.body;

  try {
    const resultado = await EstoqueMateriaPrimaModel.buscarPorFornecedorComFiltros(filtros);

    if (resultado.totalRegistros === 0) {
      return res.status(404).send({ mensagem: 'Nenhum material encontrado para este fornecedor.' });
    }

    res.status(200).send({
      mensagem: 'Materiais encontrados com sucesso!',
      paginaAtual: filtros.pagina || 1,
      quantidadePorPagina: filtros.quantidadePorPagina || 10,
      totalRegistros: resultado.totalRegistros,
      materiais: resultado.materiais
    });
  } catch (error) {
    res.status(500).send({ mensagem: 'Erro ao buscar materiais.', error });
  }
};

export const excluirPorId = async (req: Request, res: Response) => {
  const id = Number(req.params.id);

  if (!id || isNaN(id)) {
    return res.status(400).send({ mensagem: "ID inválido para exclusão." });
  }

  try {
    const sucesso = await EstoqueMateriaPrimaModel.excluirPorId(id);

    if (!sucesso) {
      return res.status(404).send({ mensagem: "Registro não encontrado para exclusão." });
    }

    res.status(200).send({ mensagem: "Registro excluído com sucesso." });
  } catch (error) {
    res.status(500).send({ mensagem: "Erro ao excluir registro.", error });
  }
};

export const atualizarMateriaPrima = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const dadosAtualizados = req.body;

  if (!id || isNaN(id)) {
    return res.status(400).send({ mensagem: 'ID inválido para atualização.' });
  }

  try {
    const atualizado = await EstoqueMateriaPrimaModel.atualizar(id, dadosAtualizados);

    if (!atualizado) {
      return res.status(404).send({ mensagem: 'Registro não encontrado para atualização.' });
    }

    return res.status(200).send({ mensagem: 'Registro atualizado com sucesso.' });
  } catch (error) {
    return res.status(500).send({ mensagem: 'Erro ao atualizar registro.', error });
  }
};

export const buscarPorFornecedor = async (req: Request, res: Response) => {
  const { idFornecedor_suprimentos } = req.body;

  if (!idFornecedor_suprimentos || isNaN(Number(idFornecedor_suprimentos))) {
    return res.status(400).send({ mensagem: "ID do fornecedor inválido." });
  }

  try {
    const resultado = await EstoqueMateriaPrimaModel.buscarPorFornecedor(Number(idFornecedor_suprimentos));

    if (!resultado || resultado.length === 0) {
      return res.status(404).send({ mensagem: "Nenhuma matéria-prima encontrada para este fornecedor." });
    }

    res.status(200).send({
      mensagem: "Matérias-primas encontradas com sucesso!",
      materias: resultado
    });
  } catch (error) {
    res.status(500).send({ mensagem: "Erro ao buscar matérias-primas.", error });
  }
};