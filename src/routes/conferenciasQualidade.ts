import { Router } from 'express';
import * as conferenciasQualidadeController from '../controllers/conferenciasQualidadeController';
import * as login from '../middleware/login';

/**
 * @swagger
 * tags:
 *   name: ConferenciasQualidade
 *   description: Registro de conferencias de qualidade.
 * components:
 *   schemas:
 *     ConferenciaQualidadeInput:
 *       type: object
 *       required:
 *         - idProdutoProducao
 *       properties:
 *         idProdutoProducao:
 *           type: integer
 *         identificador:
 *           type: string
 *         dataConferencia:
 *           type: string
 *           format: date-time
 *         status:
 *           type: string
 *         qtdInspecionada:
 *           type: integer
 *         qtdAprovada:
 *           type: integer
 *         qtdReprovada:
 *           type: integer
 *         observacaoGeral:
 *           type: string
 *         requerReinspecao:
 *           type: integer
 *           enum: [0, 1]
 *         finalizada:
 *           type: integer
 *           enum: [0, 1]
 */

const router = Router();

/**
 * @swagger
 * /qualidade/conferencias_qualidade:
 *   post:
 *     summary: Cria uma conferencia de qualidade.
 *     tags: [ConferenciasQualidade]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ConferenciaQualidadeInput'
 *     responses:
 *       201:
 *         description: Conferencia criada.
 *       400:
 *         description: Dados invalidos.
 *       404:
 *         description: Produto de producao nao encontrado.
 */
router.post('/conferencias_qualidade', conferenciasQualidadeController.criarConferencia);

/**
 * @swagger
 * /qualidade/conferencias_qualidade:
 *   get:
 *     summary: Lista conferencias com filtros e paginacao.
 *     tags: [ConferenciasQualidade]
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
 *         name: idProdutoProducao
 *         schema:
 *           type: integer
 *       - in: query
 *         name: identificador
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: requerReinspecao
 *         schema:
 *           type: integer
 *           enum: [0, 1]
 *       - in: query
 *         name: finalizada
 *         schema:
 *           type: integer
 *           enum: [0, 1]
 *       - in: query
 *         name: dataConferenciaDe
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: dataConferenciaAte
 *         schema:
 *           type: string
 *           format: date-time
 *     responses:
 *       200:
 *         description: Lista paginada.
 */
router.get('/conferencias_qualidade', conferenciasQualidadeController.listarConferencias);

/**
 * @swagger
 * /qualidade/conferencias_qualidade/{id}:
 *   get:
 *     summary: Busca conferencia por id.
 *     tags: [ConferenciasQualidade]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Conferencia encontrada.
 *       404:
 *         description: Conferencia nao encontrada.
 */
router.get('/conferencias_qualidade/:id', conferenciasQualidadeController.obterConferencia);

/**
 * @swagger
 * /qualidade/conferencias_qualidade/{id}:
 *   put:
 *     summary: Atualiza uma conferencia de qualidade.
 *     tags: [ConferenciasQualidade]
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
 *             $ref: '#/components/schemas/ConferenciaQualidadeInput'
 *     responses:
 *       200:
 *         description: Conferencia atualizada.
 *       400:
 *         description: Dados invalidos.
 *       404:
 *         description: Conferencia nao encontrada.
 */
router.put('/conferencias_qualidade/:id', conferenciasQualidadeController.atualizarConferencia);

/**
 * @swagger
 * /qualidade/conferencias_qualidade/{id}:
 *   delete:
 *     summary: Remove uma conferencia de qualidade.
 *     tags: [ConferenciasQualidade]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Conferencia removida.
 *       404:
 *         description: Conferencia nao encontrada.
 */
router.delete('/conferencias_qualidade/:id', conferenciasQualidadeController.removerConferencia);

export default router;
