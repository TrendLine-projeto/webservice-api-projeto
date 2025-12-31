import { Router } from 'express';
import * as ProdutosSupriController from '../controllers/ProdutosSupriController';
import * as login from '../middleware/login';

/**
 * @swagger
 * tags:
 *   name: ProdutosSuprimentos
 *   description: Itens comprados de fornecedores de suprimentos.
 * components:
 *   schemas:
 *     ProdutoSuprimentoInput:
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
 *         precoUnitario:
 *           type: number
 *         idFornecedor:
 *           type: integer
 */

const router = Router();

/**
 * @swagger
 * /produtoSupri/produtos_suprimentos:
 *   post:
 *     summary: Cadastra um produto de suprimento.
 *     tags: [ProdutosSuprimentos]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProdutoSuprimentoInput'
 *     responses:
 *       201:
 *         description: Produto criado.
 */
router.post('/produtos_suprimentos', ProdutosSupriController.criarProduto);

/**
 * @swagger
 * /produtoSupri/produtos_suprimentos/buscar:
 *   post:
 *     summary: Busca produtos de suprimentos por filtros do cliente.
 *     tags: [ProdutosSuprimentos]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             additionalProperties: true
 *     responses:
 *       200:
 *         description: Lista encontrada.
 */
router.post('/produtos_suprimentos/buscar', ProdutosSupriController.buscarProdutosPorCliente);

/**
 * @swagger
 * /produtoSupri/produtos_suprimentos/lista_simples:
 *   post:
 *     summary: Retorna uma lista resumida de produtos por fornecedor.
 *     tags: [ProdutosSuprimentos]
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
 *         description: Lista simplificada.
 */
router.post('/produtos_suprimentos/lista_simples', ProdutosSupriController.buscarProdutosSimplesPorFornecedor);

export default router;
