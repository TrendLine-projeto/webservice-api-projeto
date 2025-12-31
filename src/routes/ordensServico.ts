import { Router } from 'express';
import * as ordensServicoController from '../controllers/ordensServicoController';
import * as login from '../middleware/login';

/**
 * @swagger
 * tags:
 *   name: OrdensServico
 *   description: Ordens de servico abertas e finalizadas.
 * components:
 *   schemas:
 *     OrdemServicoInput:
 *       type: object
 *       required:
 *         - descricao
 *         - numeroOrdem
 *         - idCliente
 *       properties:
 *         descricao:
 *           type: string
 *         descricaoAtivo:
 *           type: string
 *         numeroOrdem:
 *           type: string
 *         dataAbertura:
 *           type: string
 *           format: date
 *         ordemManual:
 *           type: integer
 *           description: 0 ou 1
 *         finalizado:
 *           type: integer
 *           description: 0 ou 1
 *         dataFinalizado:
 *           type: string
 *           format: date-time
 *         descricaoFinalizado:
 *           type: string
 *         idCliente:
 *           type: integer
 */

const router = Router();

/**
 * @swagger
 * /ordensServico:
 *   post:
 *     summary: Cria uma nova ordem de servico.
 *     tags: [OrdensServico]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/OrdemServicoInput'
 *     responses:
 *       201:
 *         description: Ordem criada.
 *       400:
 *         description: Dados invalidos.
 */
router.post('/', ordensServicoController.criarOrdem);

/**
 * @swagger
 * /ordensServico:
 *   get:
 *     summary: Lista ordens de servico com filtros e paginacao.
 *     tags: [OrdensServico]
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
 *         name: finalizado
 *         schema:
 *           type: integer
 *       - in: query
 *         name: numeroOrdem
 *         schema:
 *           type: string
 *       - in: query
 *         name: busca
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lista paginada.
 */
router.get('/', ordensServicoController.listarOrdens);

/**
 * @swagger
 * /ordensServico/{id}:
 *   get:
 *     summary: Busca ordem de servico por id.
 *     tags: [OrdensServico]
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
 *         description: Ordem nao encontrada.
 */
router.get('/:id', ordensServicoController.obterOrdem);

/**
 * @swagger
 * /ordensServico/{id}:
 *   put:
 *     summary: Atualiza uma ordem de servico.
 *     tags: [OrdensServico]
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
 *             $ref: '#/components/schemas/OrdemServicoInput'
 *     responses:
 *       200:
 *         description: Ordem atualizada.
 *       404:
 *         description: Ordem nao encontrada.
 */
router.put('/:id', ordensServicoController.atualizarOrdem);

/**
 * @swagger
 * /ordensServico/{id}/finalizar:
 *   patch:
 *     summary: Finaliza uma ordem de servico.
 *     tags: [OrdensServico]
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
 *             required:
 *               - descricaoFinalizado
 *             properties:
 *               finalizado:
 *                 type: integer
 *                 description: Default 1
 *               descricaoFinalizado:
 *                 type: string
 *               dataFinalizado:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Ordem finalizada.
 *       404:
 *         description: Ordem nao encontrada.
 */
router.patch('/:id/finalizar', ordensServicoController.finalizarOrdem);

/**
 * @swagger
 * /ordensServico/{id}:
 *   delete:
 *     summary: Remove uma ordem de servico.
 *     tags: [OrdensServico]
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
 *         description: Ordem nao encontrada.
 */
router.delete('/:id', ordensServicoController.removerOrdem);

export default router;
