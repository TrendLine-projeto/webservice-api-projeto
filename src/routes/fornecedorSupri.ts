import { Router } from 'express';
import * as FornecedorSupriController from '../controllers/fornecedorSupriController';
import * as login from '../middleware/login';

/**
 * @swagger
 * tags:
 *   name: FornecedoresSuprimentos
 *   description: Fornecedores responsaveis por insumos e materias auxiliares.
 * components:
 *   schemas:
 *     FornecedorSupriInput:
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
 *         telefone:
 *           type: string
 *         email:
 *           type: string
 */

const router = Router();

/**
 * @swagger
 * /fornecedorSupri/fornecedores_suprimentos/{id}:
 *   get:
 *     summary: Busca fornecedor de suprimentos pelo id.
 *     tags: [FornecedoresSuprimentos]
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
router.get('/fornecedores_suprimentos/:id', FornecedorSupriController.buscarFornecedorPorId);

/**
 * @swagger
 * /fornecedorSupri/fornecedores_suprimentos:
 *   post:
 *     summary: Cadastra um fornecedor de suprimentos.
 *     tags: [FornecedoresSuprimentos]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/FornecedorSupriInput'
 *     responses:
 *       201:
 *         description: Fornecedor criado.
 */
router.post('/fornecedores_suprimentos', FornecedorSupriController.criarFornecedor);

/**
 * @swagger
 * /fornecedorSupri/fornecedores_suprimentos/buscar:
 *   post:
 *     summary: Lista fornecedores de suprimentos por cliente.
 *     tags: [FornecedoresSuprimentos]
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
router.post('/fornecedores_suprimentos/buscar', FornecedorSupriController.buscarFornecedoresPorCliente);

/**
 * @swagger
 * /fornecedorSupri/fornecedores_suprimentos/lista_simples:
 *   post:
 *     summary: Retorna uma lista simplificada para seletores.
 *     tags: [FornecedoresSuprimentos]
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
router.post('/fornecedores_suprimentos/lista_simples', FornecedorSupriController.buscarFornecedoresSimplesPorCliente);

/**
 * @swagger
 * /fornecedorSupri/fornecedores_suprimentos/editar/{id}:
 *   put:
 *     summary: Atualiza os dados de um fornecedor de suprimentos.
 *     tags: [FornecedoresSuprimentos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/FornecedorSupriInput'
 *     responses:
 *       200:
 *         description: Fornecedor atualizado.
 */
router.put('/fornecedores_suprimentos/editar/:id', FornecedorSupriController.editarFornecedor);

/**
 * @swagger
 * /fornecedorSupri/fornecedores_suprimentos/deletar/{id}:
 *   delete:
 *     summary: Remove um fornecedor de suprimentos.
 *     tags: [FornecedoresSuprimentos]
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
router.delete('/fornecedores_suprimentos/deletar/:id', FornecedorSupriController.deletarFornecedor);

export default router;
