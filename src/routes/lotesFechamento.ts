import { Router } from 'express';
import * as lotesFechamentoController from '../controllers/lotesFechamentoController';
import * as login from '../middleware/login';

/**
 * @swagger
 * tags:
 *   name: LotesFechamento
 *   description: Registro de fechamento de lotes.
 * components:
 *   schemas:
 *     LoteFechamentoInput:
 *       type: object
 *       required:
 *         - id_entrada_lote
 *         - concluido100
 *       properties:
 *         id_entrada_lote:
 *           type: integer
 *         concluido100:
 *           type: integer
 *           description: 0 ou 1
 *         teveBonus:
 *           type: integer
 *           description: 0 ou 1
 *         bonusValor:
 *           type: number
 *         pecasConcluidasSucesso:
 *           type: integer
 *         acrescimoEntregaPercent:
 *           type: number
 *         fechadoEm:
 *           type: string
 *           format: date-time
 */

const router = Router();

/**
 * @swagger
 * /lotes/lotes_fechamento:
 *   post:
 *     summary: Cria um fechamento de lote.
 *     tags: [LotesFechamento]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoteFechamentoInput'
 *     responses:
 *       201:
 *         description: Fechamento criado.
 *       400:
 *         description: Dados invalidos.
 *       409:
 *         description: Lote ja encerrado.
 */
router.post('/lotes_fechamento', lotesFechamentoController.criarFechamento);

/**
 * @swagger
 * /lotes/lotes_fechamento/buscar:
 *   post:
 *     summary: Lista fechamentos com filtros e paginacao.
 *     tags: [LotesFechamento]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             additionalProperties: true
 *     responses:
 *       200:
 *         description: Lista de fechamentos.
 *       404:
 *         description: Nenhum fechamento encontrado.
 */
router.post('/lotes_fechamento/buscar', lotesFechamentoController.buscarFechamentos);

/**
 * @swagger
 * /lotes/lotes_fechamento/{id}:
 *   get:
 *     summary: Busca fechamento por id.
 *     tags: [LotesFechamento]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Fechamento encontrado.
 *       404:
 *         description: Fechamento nao encontrado.
 */
router.get('/lotes_fechamento/:id', lotesFechamentoController.buscarFechamentoPorId);

/**
 * @swagger
 * /lotes/lotes_fechamento/editar/{id}:
 *   put:
 *     summary: Atualiza um fechamento de lote.
 *     tags: [LotesFechamento]
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
 *             $ref: '#/components/schemas/LoteFechamentoInput'
 *     responses:
 *       200:
 *         description: Fechamento atualizado.
 *       404:
 *         description: Fechamento nao encontrado.
 */
router.put('/lotes_fechamento/editar/:id', lotesFechamentoController.editarFechamento);

/**
 * @swagger
 * /lotes/lotes_fechamento/deletar/{id}:
 *   delete:
 *     summary: Remove um fechamento de lote.
 *     tags: [LotesFechamento]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Fechamento removido.
 *       404:
 *         description: Fechamento nao encontrado.
 */
router.delete('/lotes_fechamento/deletar/:id', lotesFechamentoController.deletarFechamento);

export default router;
