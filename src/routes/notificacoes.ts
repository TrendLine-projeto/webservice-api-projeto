import { Router } from 'express';
import * as notificacoesController from '../controllers/notificacoesController';
import * as login from '../middleware/login';

/**
 * @swagger
 * tags:
 *   name: Notificacoes
 *   description: Gerenciamento de notificacoes dos clientes.
 * components:
 *   schemas:
 *     NotificacaoInput:
 *       type: object
 *       required:
 *         - descricao
 *         - url
 *         - tipo
 *         - idCliente
 *       properties:
 *         descricao:
 *           type: string
 *         url:
 *           type: string
 *         tipo:
 *           type: string
 *         dataCriacao:
 *           type: string
 *           format: date-time
 *         idCliente:
 *           type: integer
 */

const router = Router();

/**
 * @swagger
 * /notificacoes:
 *   post:
 *     summary: Cria uma nova notificacao.
 *     tags: [Notificacoes]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/NotificacaoInput'
 *     responses:
 *       201:
 *         description: Notificacao criada.
 *       400:
 *         description: Dados invalidos.
 */
router.post('/', notificacoesController.criarNotificacao);

/**
 * @swagger
 * /notificacoes:
 *   get:
 *     summary: Lista notificacoes com filtros e paginacao.
 *     tags: [Notificacoes]
 *     parameters:
 *       - in: query
 *         name: pagina
 *         schema:
 *           type: integer
 *       - in: query
 *         name: quantidadePorPagina
 *         schema:
 *           type: integer
 *       - in: query
 *         name: idCliente
 *         schema:
 *           type: integer
 *       - in: query
 *         name: tipo
 *         schema:
 *           type: string
 *       - in: query
 *         name: busca
 *         schema:
 *           type: string
 *         description: Busca por descricao ou url.
 *       - in: query
 *         name: dataCriacaoDe
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: dataCriacaoAte
 *         schema:
 *           type: string
 *           format: date-time
 *     responses:
 *       200:
 *         description: Lista paginada.
 */
router.get('/', notificacoesController.listarNotificacoes);

/**
 * @swagger
 * /notificacoes/{id}:
 *   get:
 *     summary: Busca notificacao por id.
 *     tags: [Notificacoes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Registro encontrado.
 *       404:
 *         description: Notificacao nao encontrada.
 */
router.get('/:id', notificacoesController.obterNotificacao);

/**
 * @swagger
 * /notificacoes/{id}:
 *   put:
 *     summary: Atualiza uma notificacao.
 *     tags: [Notificacoes]
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
 *             $ref: '#/components/schemas/NotificacaoInput'
 *     responses:
 *       200:
 *         description: Notificacao atualizada.
 *       404:
 *         description: Notificacao nao encontrada.
 */
router.put('/:id', notificacoesController.atualizarNotificacao);

/**
 * @swagger
 * /notificacoes/{id}:
 *   delete:
 *     summary: Remove uma notificacao.
 *     tags: [Notificacoes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Registro removido.
 *       404:
 *         description: Notificacao nao encontrada.
 */
router.delete('/:id', notificacoesController.removerNotificacao);

export default router;
