import { Router } from 'express';
import * as EstoqueInsumosController from '../controllers/estoqueInsumosController';
import * as login from '../middleware/login';

/**
 * @swagger
 * tags:
 *   name: EstoqueInsumos
 *   description: Controle de insumos tecnicos e auxiliares.
 * components:
 *   schemas:
 *     InsumoInput:
 *       type: object
 *       required:
 *         - nome
 *         - idFornecedor
 *       properties:
 *         nome:
 *           type: string
 *         descricao:
 *           type: string
 *         quantidade:
 *           type: number
 *         unidadeMedida:
 *           type: string
 *         idFornecedor:
 *           type: integer
 */

const router = Router();

/**
 * @swagger
 * /estoqueInsumos/estoque_insumo/{id}:
 *   get:
 *     summary: Busca insumo pelo id.
 *     tags: [EstoqueInsumos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Insumo encontrado.
 *       404:
 *         description: Insumo nao encontrado.
 */
router.get('/estoque_insumo/:id', EstoqueInsumosController.estoqueInsumosPorId);

/**
 * @swagger
 * /estoqueInsumos/estoque_insumo/lista_por_fornecedor:
 *   post:
 *     summary: Lista insumos associados a um fornecedor.
 *     tags: [EstoqueInsumos]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               idFornecedor:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Itens encontrados.
 */
router.post('/estoque_insumo/lista_por_fornecedor', EstoqueInsumosController.buscarPorFornecedor);

/**
 * @swagger
 * /estoqueInsumos/estoque_insumo:
 *   post:
 *     summary: Cadastra um novo insumo.
 *     tags: [EstoqueInsumos]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/InsumoInput'
 *     responses:
 *       201:
 *         description: Insumo criado.
 */
router.post('/estoque_insumo', EstoqueInsumosController.criarInsumo);

/**
 * @swagger
 * /estoqueInsumos/estoque_insumo/buscar:
 *   post:
 *     summary: Busca insumos por fornecedor com filtros extras.
 *     tags: [EstoqueInsumos]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             additionalProperties: true
 *     responses:
 *       200:
 *         description: Resultado da busca.
 */
router.post('/estoque_insumo/buscar', EstoqueInsumosController.buscarInsumoPorFornecedor);

/**
 * @swagger
 * /estoqueInsumos/estoque_insumo/editar/{id}:
 *   put:
 *     summary: Atualiza os dados de um insumo.
 *     tags: [EstoqueInsumos]
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
 *             $ref: '#/components/schemas/InsumoInput'
 *     responses:
 *       200:
 *         description: Insumo atualizado.
 */
router.put('/estoque_insumo/editar/:id', EstoqueInsumosController.atualizarInsumo);

/**
 * @swagger
 * /estoqueInsumos/estoque_insumo/deletar/{id}:
 *   delete:
 *     summary: Remove um insumo.
 *     tags: [EstoqueInsumos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Insumo removido.
 */
router.delete('/estoque_insumo/deletar/:id', EstoqueInsumosController.excluirPorId);

export default router;
