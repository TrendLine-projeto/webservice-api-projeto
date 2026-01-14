import { Router } from 'express';
import * as conferenciaQualidadeDefeitosController from '../controllers/conferenciaQualidadeDefeitosController';
import * as login from '../middleware/login';

/**
 * @swagger
 * tags:
 *   name: ConferenciaQualidadeDefeitos
 *   description: Registro de defeitos por conferencia de qualidade.
 * components:
 *   schemas:
 *     ConferenciaQualidadeDefeitoInput:
 *       type: object
 *       required:
 *         - id
 *         - idConferenciaQualidade
 *       properties:
 *         id:
 *           type: integer
 *         idConferenciaQualidade:
 *           type: integer
 *         tipoDefeito:
 *           type: string
 *         quantidade:
 *           type: integer
 *         observacao:
 *           type: string
 */

const router = Router();

/**
 * @swagger
 * /qualidade/conferencia_qualidade_defeitos:
 *   post:
 *     summary: Cria um defeito de conferencia de qualidade.
 *     tags: [ConferenciaQualidadeDefeitos]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ConferenciaQualidadeDefeitoInput'
 *     responses:
 *       201:
 *         description: Defeito criado.
 *       400:
 *         description: Dados invalidos.
 *       404:
 *         description: Conferencia nao encontrada.
 */
router.post('/conferencia_qualidade_defeitos', conferenciaQualidadeDefeitosController.criarDefeito);

/**
 * @swagger
 * /qualidade/conferencia_qualidade_defeitos:
 *   get:
 *     summary: Lista defeitos com filtros e paginacao.
 *     tags: [ConferenciaQualidadeDefeitos]
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
 *         name: idConferenciaQualidade
 *         schema:
 *           type: integer
 *       - in: query
 *         name: tipoDefeito
 *         schema:
 *           type: string
 *       - in: query
 *         name: quantidade
 *         schema:
 *           type: integer
 *       - in: query
 *         name: observacao
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lista paginada.
 */
router.get('/conferencia_qualidade_defeitos', conferenciaQualidadeDefeitosController.listarDefeitos);

/**
 * @swagger
 * /qualidade/conferencia_qualidade_defeitos/{id}:
 *   get:
 *     summary: Busca defeito por id.
 *     tags: [ConferenciaQualidadeDefeitos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Defeito encontrado.
 *       404:
 *         description: Defeito nao encontrado.
 */
router.get('/conferencia_qualidade_defeitos/:id', conferenciaQualidadeDefeitosController.obterDefeito);

/**
 * @swagger
 * /qualidade/conferencia_qualidade_defeitos/{id}:
 *   put:
 *     summary: Atualiza um defeito de conferencia de qualidade.
 *     tags: [ConferenciaQualidadeDefeitos]
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
 *             $ref: '#/components/schemas/ConferenciaQualidadeDefeitoInput'
 *     responses:
 *       200:
 *         description: Defeito atualizado.
 *       400:
 *         description: Dados invalidos.
 *       404:
 *         description: Defeito nao encontrado.
 */
router.put('/conferencia_qualidade_defeitos/:id', conferenciaQualidadeDefeitosController.atualizarDefeito);

/**
 * @swagger
 * /qualidade/conferencia_qualidade_defeitos/{id}:
 *   delete:
 *     summary: Remove um defeito.
 *     tags: [ConferenciaQualidadeDefeitos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Defeito removido.
 *       404:
 *         description: Defeito nao encontrado.
 */
router.delete('/conferencia_qualidade_defeitos/:id', conferenciaQualidadeDefeitosController.removerDefeito);

export default router;
