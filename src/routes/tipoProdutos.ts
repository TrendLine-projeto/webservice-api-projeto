import { Router } from 'express';
import * as TipoProdutosController from '../controllers/tipoProdutosController';
import * as login from '../middleware/login';

/**
 * @swagger
 * tags:
 *   name: TiposProdutos
 *   description: Utilitarios para classificacao e conferencia de estoque.
 * components:
 *   schemas:
 *     ConferenciaFiltro:
 *       type: object
 *       properties:
 *         idFilial:
 *           type: integer
 *         dataReferencia:
 *           type: string
 *           format: date
 */

const router = Router();

/**
 * @swagger
 * /tipoProdutos/tipos_produto:
 *   get:
 *     summary: Lista tipos de produto organizados por categoria.
 *     tags: [TiposProdutos]
 *     responses:
 *       200:
 *         description: Lista de tipos de produto.
 */
router.get('/tipos_produto', TipoProdutosController.tiposProdutoPorCategoria);

/**
 * @swagger
 * /tipoProdutos/conferencia:
 *   post:
 *     summary: Busca dados da conferencia de estoque.
 *     tags: [TiposProdutos]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ConferenciaFiltro'
 *     responses:
 *       200:
 *         description: Resultado da conferencia.
 */
router.post('/conferencia', TipoProdutosController.buscarConferenciaEstoqueController);

/**
 * @swagger
 * /tipoProdutos/conferencia/salvar:
 *   post:
 *     summary: Registra uma conferencia de estoque.
 *     tags: [TiposProdutos]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             additionalProperties: true
 *     responses:
 *       201:
 *         description: Conferencia salva.
 */
router.post('/conferencia/salvar', TipoProdutosController.salvarConferencia);

export default router;
