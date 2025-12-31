import { Router } from 'express';
import * as FornecedorProducaoController from '../controllers/fornecedorProducaoController';
import * as login from '../middleware/login';

/**
 * @swagger
 * tags:
 *   name: FornecedoresProducao
 *   description: Parceiros que fabricam ou terceirizam parte da producao.
 * components:
 *   schemas:
 *     FornecedorProducaoInput:
 *       type: object
 *       required:
 *         - razaoSocial
 *         - cnpj
 *       properties:
 *         razaoSocial:
 *           type: string
 *         nomeFantasia:
 *           type: string
 *         cnpj:
 *           type: string
 *         contato:
 *           type: string
 */

const router = Router();

/**
 * @swagger
 * /fornecedorProd/fornecedores_producao/{id}:
 *   get:
 *     summary: Busca fornecedor de producao pelo id.
 *     tags: [FornecedoresProducao]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Fornecedor encontrado.
 *       404:
 *         description: Fornecedor nao encontrado.
 */
router.get('/fornecedores_producao/:id', FornecedorProducaoController.buscarFornecedorPorId);

/**
 * @swagger
 * /fornecedorProd/fornecedores_producao:
 *   post:
 *     summary: Cadastra um fornecedor de producao.
 *     tags: [FornecedoresProducao]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/FornecedorProducaoInput'
 *     responses:
 *       201:
 *         description: Fornecedor criado.
 */
router.post('/fornecedores_producao', FornecedorProducaoController.criarFornecedor);

/**
 * @swagger
 * /fornecedorProd/fornecedores_producao/buscar:
 *   post:
 *     summary: Lista fornecedores de producao com filtros.
 *     tags: [FornecedoresProducao]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             additionalProperties: true
 *     responses:
 *       200:
 *         description: Fornecedores encontrados.
 */
router.post('/fornecedores_producao/buscar', FornecedorProducaoController.buscarFornecedoresPorCliente);

/**
 * @swagger
 * /fornecedorProd/fornecedores_producao/lista_simples:
 *   post:
 *     summary: Retorna lista simples para selecao rapida.
 *     tags: [FornecedoresProducao]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               idCliente:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Lista simples.
 */
router.post('/fornecedores_producao/lista_simples', FornecedorProducaoController.buscarFornecedoresSimplesPorCliente);

/**
 * @swagger
 * /fornecedorProd/fornecedores_producao/deletar/{id}:
 *   delete:
 *     summary: Remove um fornecedor de producao.
 *     tags: [FornecedoresProducao]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Fornecedor removido.
 */
router.delete('/fornecedores_producao/deletar/:id', FornecedorProducaoController.deletarFornecedor);

export default router;
