import { Router } from 'express';
import * as produtosProducaoController from '../controllers/producaoProdutosController';
import * as login from '../middleware/login';

/**
 * @swagger
 * tags:
 *   name: ProdutosProducao
 *   description: Cadastro de produtos fabricados internamente.
 * components:
 *   schemas:
 *     ProdutoProducaoInput:
 *       type: object
 *       required:
 *         - nome
 *         - codigo
 *       properties:
 *         nome:
 *           type: string
 *         codigo:
 *           type: string
 *         descricao:
 *           type: string
 *         unidadeMedida:
 *           type: string
 *         custoPadrao:
 *           type: number
 */

const router = Router();

/**
 * @swagger
 * /produtorProducao/produtos_producao:
 *   post:
 *     summary: Cria um produto de producao.
 *     tags: [ProdutosProducao]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProdutoProducaoInput'
 *     responses:
 *       201:
 *         description: Produto criado.
 */
router.post('/produtos_producao', produtosProducaoController.criarProduto);

/**
 * @swagger
 * /produtorProducao/produtos_producao/buscar:
 *   post:
 *     summary: Lista produtos de producao por cliente/fornecedor.
 *     tags: [ProdutosProducao]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             additionalProperties: true
 *     responses:
 *       200:
 *         description: Produtos encontrados.
 */
router.post('/produtos_producao/buscar', produtosProducaoController.buscarProdutosPorCliente);

/**
 * @swagger
 * /produtorProducao/produtos_producao/{id}:
 *   get:
 *     summary: Detalhes de um produto de producao.
 *     tags: [ProdutosProducao]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Produto encontrado.
 *       404:
 *         description: Produto nao encontrado.
 */
router.get('/produtos_producao/:id', produtosProducaoController.buscarProdutoPorId);

/**
 * @swagger
 * /produtorProducao/produtos_producao/alterar/{id}:
 *   put:
 *     summary: Atualiza um produto de producao.
 *     tags: [ProdutosProducao]
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
 *             $ref: '#/components/schemas/ProdutoProducaoInput'
 *     responses:
 *       200:
 *         description: Produto atualizado.
 *       404:
 *         description: Produto nao encontrado.
 */
router.put('/produtos_producao/alterar/:id', produtosProducaoController.atualizarProdutoPorId);

/**
 * @swagger
 * /produtorProducao/produtos_producao/deletar/{id}:
 *   delete:
 *     summary: Remove um produto de producao.
 *     tags: [ProdutosProducao]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Produto removido.
 */
router.delete('/produtos_producao/deletar/:id', produtosProducaoController.deletarPorId);

export default router;
