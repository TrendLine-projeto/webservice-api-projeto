import { Router } from 'express';
import * as lotesController from '../controllers/lotesController';
import * as login from '../middleware/login';

/**
 * @swagger
 * tags:
 *   name: Lotes
 *   description: Controle de entrada, progresso e encerramento de lotes de producao.
 * components:
 *   schemas:
 *     LoteProduto:
 *       type: object
 *       properties:
 *         idProduto:
 *           type: integer
 *         quantidade:
 *           type: number
 *     EntradaLoteInput:
 *       type: object
 *       required:
 *         - idFilial
 *         - produtos
 *       properties:
 *         idFilial:
 *           type: integer
 *         dataEntrada:
 *           type: string
 *           format: date
 *         observacoes:
 *           type: string
 *         produtos:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/LoteProduto'
 */

const router = Router();

/**
 * @swagger
 * /lotes/entrada_lotes:
 *   post:
 *     summary: Cria uma entrada de lote.
 *     tags: [Lotes]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/EntradaLoteInput'
 *     responses:
 *       201:
 *         description: Lote criado.
 *       400:
 *         description: Dados invalidos ou filial nao encontrada.
 */
router.post('/entrada_lotes', lotesController.criarLote);

/**
 * @swagger
 * /lotes/entrada_lotes/buscar:
 *   post:
 *     summary: Busca lotes por filtros do cliente.
 *     tags: [Lotes]
 *     requestBody:
 *       description: Informar filtros como idFilial, periodo e paginacao.
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             additionalProperties: true
 *     responses:
 *       200:
 *         description: Lista paginada de lotes.
 *       404:
 *         description: Nenhum lote encontrado.
 */
router.post('/entrada_lotes/buscar', lotesController.buscarLotesComFiltro);

/**
 * @swagger
 * /lotes/entrada_lotes/iniciarLote:
 *   post:
 *     summary: Marca um lote como iniciado.
 *     tags: [Lotes]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               idEntrada_lotes:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Lote iniciado.
 */
router.post('/entrada_lotes/iniciarLote', lotesController.iniciarLote);

/**
 * @swagger
 * /lotes/entrada_lotes/encerarLote:
 *   post:
 *     summary: Encerra um lote em andamento.
 *     tags: [Lotes]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               idEntrada_lotes:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Lote encerrado.
 */
router.post('/entrada_lotes/encerarLote', lotesController.encerrarLote);

/**
 * @swagger
 * /lotes/entrada_lotes/reabrirLote:
 *   post:
 *     summary: Reabre um lote previamente encerrado.
 *     tags: [Lotes]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               idEntrada_lotes:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Lote reaberto.
 */
router.post('/entrada_lotes/reabrirLote', lotesController.reabrirLote);

/**
 * @swagger
 * /lotes/entrada_lotes/{id}:
 *   get:
 *     summary: Consulta os detalhes completos de um lote.
 *     tags: [Lotes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Dados completos do lote.
 *       404:
 *         description: Lote nao encontrado.
 */
router.get('/entrada_lotes/:id', lotesController.buscarLotePorId);

/**
 * @swagger
 * /lotes/entrada_lotes/alterar/{id}:
 *   put:
 *     summary: Atualiza um lote inteiro (dados e produtos).
 *     tags: [Lotes]
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
 *             type: object
 *             additionalProperties: true
 *     responses:
 *       200:
 *         description: Lote atualizado.
 */
router.put('/entrada_lotes/alterar/:id', lotesController.atualizarLoteCompleto);

/**
 * @swagger
 * /lotes/entrada_lotes/deletar/{id}:
 *   delete:
 *     summary: Remove um lote e os produtos associados.
 *     tags: [Lotes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Lote excluido.
 */
router.delete('/entrada_lotes/deletar/:id', lotesController.deletarPorId);

export default router;
