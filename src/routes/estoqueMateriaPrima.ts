import { Router } from 'express';
import * as EstoqueMateriaPrimaController from '../controllers/estoqueMateriaPrimaController';
import * as login from '../middleware/login';

/**
 * @swagger
 * tags:
 *   name: EstoqueMateriaPrima
 *   description: Controle de itens de materia prima.
 * components:
 *   schemas:
 *     MateriaPrimaInput:
 *       type: object
 *       required:
 *         - nome
 *         - idFornecedor
 *       properties:
 *         nome:
 *           type: string
 *         descricao:
 *           type: string
 *         unidadeMedida:
 *           type: string
 *         quantidade:
 *           type: number
 *         idFornecedor:
 *           type: integer
 */

const router = Router();

/**
 * @swagger
 * /estoque/estoque_materiaprima/{id}:
 *   get:
 *     summary: Busca item de materia prima pelo id.
 *     tags: [EstoqueMateriaPrima]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Item encontrado.
 *       404:
 *         description: Item nao encontrado.
 */
router.get('/estoque_materiaprima/:id', EstoqueMateriaPrimaController.estoquemateriaprimaPorId);

/**
 * @swagger
 * /estoque/estoque_materiaprima/lista_por_fornecedor:
 *   post:
 *     summary: Lista itens de materia prima de um fornecedor.
 *     tags: [EstoqueMateriaPrima]
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
router.post('/estoque_materiaprima/lista_por_fornecedor', EstoqueMateriaPrimaController.buscarPorFornecedor);

/**
 * @swagger
 * /estoque/estoque_materiaprima:
 *   post:
 *     summary: Cadastra uma nova materia prima.
 *     tags: [EstoqueMateriaPrima]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/MateriaPrimaInput'
 *     responses:
 *       201:
 *         description: Item criado.
 */
router.post('/estoque_materiaprima', EstoqueMateriaPrimaController.criarMateriaPrima);

/**
 * @swagger
 * /estoque/estoque_materiaprima/buscar:
 *   post:
 *     summary: Busca materiais por fornecedor com filtros.
 *     tags: [EstoqueMateriaPrima]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             additionalProperties: true
 *     responses:
 *       200:
 *         description: Itens encontrados.
 */
router.post('/estoque_materiaprima/buscar', EstoqueMateriaPrimaController.buscarMateriaisPorFornecedor);

/**
 * @swagger
 * /estoque/estoque_materiaprima/editar/{id}:
 *   put:
 *     summary: Atualiza uma materia prima.
 *     tags: [EstoqueMateriaPrima]
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
 *             $ref: '#/components/schemas/MateriaPrimaInput'
 *     responses:
 *       200:
 *         description: Item atualizado.
 */
router.put('/estoque_materiaprima/editar/:id', EstoqueMateriaPrimaController.atualizarMateriaPrima);

/**
 * @swagger
 * /estoque/estoque_materiaprima/deletar/{id}:
 *   delete:
 *     summary: Remove item de materia prima.
 *     tags: [EstoqueMateriaPrima]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Item removido.
 */
router.delete('/estoque_materiaprima/deletar/:id', EstoqueMateriaPrimaController.excluirPorId);

export default router;
