import { Request, Response } from 'express';
import * as EstoqueInsumoModel from '../service/estoque_insumos/estoque_insumoBase';
import dotenv from 'dotenv';

dotenv.config();

export const estoqueInsumosPorId = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    if (!id || isNaN(id)) {
      return res.status(400).send({ mensagem: 'ID inválido.' });
    }

    const resultado = await EstoqueInsumoModel.estoqueInsumosPorId(id);

    if (!resultado || resultado.totalRegistros === 0) {
      return res.status(404).send({ mensagem: 'Nenhum insumo tecnico prima encontrada encontrado' });
    }

    return res.status(200).send({
      mensagem: 'Insumo tecnico encontrado com sucesso!',
      insumoTecnico: resultado.insumoTecnico
    });
  } catch (error: any) {
    if (error.tipo === 'Validacao') {
      return res.status(400).send({ mensagem: error.mensagem });
    }
    return res.status(500).send({ error: error.message || error });
  }
};

export const criarInsumo = async (req: Request, res: Response) => {
  try {
    const insumoTecnicoCriada = await EstoqueInsumoModel.criarInsumo(req.body);

    return res.status(201).send({
      mensagem: 'Insumo tecnico criado com sucesso!',
      insumoTecnicoCriada
    });
  } catch (error: any) {
    if (error.tipo === 'Validacao') {
      return res.status(400).send({ mensagem: error.mensagem });
    }

    if (error.tipo === 'FornecedorsuprimentoNaoEncontrado') {
      return res.status(404).send({ mensagem: error.mensagem });
    }

    return res.status(500).send({ mensagem: 'Erro interno ao criar Insumo tecnico.', error });
  }
};

export const buscarInsumoPorFornecedor = async (req: Request, res: Response) => {
  const filtros = req.body;

  try {
    const resultado = await EstoqueInsumoModel.buscarInsumoPorFornecedorComFiltros(filtros);

    if (resultado.totalRegistros === 0) {
      return res.status(404).send({ mensagem: 'Nenhum Insumo tecnico encontrado para este fornecedor.' });
    }

    res.status(200).send({
      mensagem: 'Insumo tecnico encontrados com sucesso!',
      paginaAtual: filtros.pagina || 1,
      quantidadePorPagina: filtros.quantidadePorPagina || 10,
      totalRegistros: resultado.totalRegistros,
      materiais: resultado.materiais
    });
  } catch (error) {
    res.status(500).send({ mensagem: 'Erro ao buscar InsumoS tecnicoS.', error });
  }
};

export const excluirPorId = async (req: Request, res: Response) => {
  const id = Number(req.params.id);

  if (!id || isNaN(id)) {
    return res.status(400).send({ mensagem: "ID inválido para exclusão." });
  }

  try {
    const sucesso = await EstoqueInsumoModel.excluirPorId(id);

    if (!sucesso) {
      return res.status(404).send({ mensagem: "Insumo tecnico não encontrado para exclusão." });
    }

    res.status(200).send({ mensagem: "Insumo tecnico excluído com sucesso." });
  } catch (error) {
    res.status(500).send({ mensagem: "Erro ao excluir Insumo tecnico.", error });
  }
};

export const atualizarInsumo = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const dadosAtualizados = req.body;

  if (!id || isNaN(id)) {
    return res.status(400).send({ mensagem: 'ID inválido para atualização.' });
  }

  try {
    const atualizado = await EstoqueInsumoModel.atualizar(id, dadosAtualizados);

    if (!atualizado) {
      return res.status(404).send({ mensagem: 'Insumo tecnico não encontrado para atualização.' });
    }

    return res.status(200).send({ mensagem: 'Insumo tecnico atualizado com sucesso.' });
  } catch (error) {
    return res.status(500).send({ mensagem: 'Erro ao atualizar Insumo tecnico.', error });
  }
};

export const buscarPorFornecedor = async (req: Request, res: Response) => {
  const { idFornecedor_suprimentos } = req.body;

  if (!idFornecedor_suprimentos || isNaN(Number(idFornecedor_suprimentos))) {
    return res.status(400).send({ mensagem: "ID do fornecedor inválido." });
  }

  try {
    const resultado = await EstoqueInsumoModel.buscarPorFornecedor(Number(idFornecedor_suprimentos));

    if (!resultado || resultado.length === 0) {
      return res.status(404).send({ mensagem: "Nenhum Insumo tecnico encontrada para este fornecedor." });
    }

    res.status(200).send({
      mensagem: "Insumo tecnico encontradO com sucesso!",
      materias: resultado
    });
  } catch (error) {
    res.status(500).send({ mensagem: "Erro ao buscar Insumo tecnico.", error });
  }
};