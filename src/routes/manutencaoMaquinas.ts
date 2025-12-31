// src/routes/manutencoesRouter.ts
import { Router } from 'express';
import * as manutencoesController from '../controllers/manutencaoMaquinasController';
import * as login from '../middleware/login';

/**
 * @swagger
 * tags:
 *   name: Manutencoes
 *   description: Operacoes de manutencao preventiva e corretiva das maquinas.
 * components:
 *   schemas:
 *     ManutencaoInput:
 *       type: object
 *       required:
 *         - tipo
 *         - idMaquina
 *         - idCliente
 *       properties:
 *         idCliente:
 *           type: integer
 *         tipo:
 *           type: string
 *           description: Categoria da manutencao.
 *         data_execucao:
 *           type: string
 *           format: date
 *         proxima_prevista:
 *           type: string
 *           format: date
 *         status:
 *           type: string
 *         custo:
 *           type: number
 *         responsavel:
 *           type: string
 *         observacoes:
 *           type: string
 *         idMaquina:
 *           type: integer
 *           description: Identificador da maquina relacionada.
 *     Manutencao:
 *       allOf:
 *         - $ref: '#/components/schemas/ManutencaoInput'
 *         - type: object
 *           properties:
 *             id:
 *               type: integer
 *             status:
 *               type: string
 *             criado_em:
 *               type: string
 *               format: date-time
 */

const router = Router();

/**
 * @swagger
 * /manutencoes:
 *   post:
 *     summary: Cria uma nova manutencao.
 *     tags: [Manutencoes]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ManutencaoInput'
 *     responses:
 *       201:
 *         description: Manutencao criada com sucesso.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 mensagem:
 *                   type: string
 *                 criado:
 *                   $ref: '#/components/schemas/Manutencao'
 *       400:
 *         description: Dados invalidos.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErroPadrao'
 *       500:
 *         description: Erro inesperado.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErroPadrao'
 */
router.post('/', manutencoesController.criarManutencao);

/**
 * @swagger
 * /manutencoes:
 *   get:
 *     summary: Lista manutencoes com filtros opcionais.
 *     tags: [Manutencoes]
 *     parameters:
 *       - in: query
 *         name: pagina
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: quantidadePorPagina
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: idMaquina
 *         schema:
 *           type: integer
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: tipo
 *         schema:
 *           type: string
 *       - in: query
 *         name: busca
 *         schema:
 *           type: string
 *           description: Busca por responsavel ou observacoes.
 *       - in: query
 *         name: idCliente
 *         schema:
 *           type: integer
 *       - in: query
 *         name: idCliente
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Lista paginada.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total:
 *                   type: integer
 *                 pagina:
 *                   type: integer
 *                 quantidadePorPagina:
 *                   type: integer
 *                 itens:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Manutencao'
 *       500:
 *         description: Erro ao listar.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErroPadrao'
 */
router.get('/', manutencoesController.listarManutencoes);

/**
 * @swagger
 * /manutencoes/{id}:
 *   get:
 *     summary: Obtem detalhes de uma manutencao.
 *     tags: [Manutencoes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Dados da manutencao.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Manutencao'
 *       404:
 *         description: Manutencao nao encontrada.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErroPadrao'
 */
router.get('/:id', manutencoesController.obterManutencao);

/**
 * @swagger
 * /manutencoes/{id}:
 *   put:
 *     summary: Atualiza uma manutencao.
 *     tags: [Manutencoes]
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
 *             $ref: '#/components/schemas/ManutencaoInput'
 *     responses:
 *       200:
 *         description: Manutencao atualizada.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 mensagem:
 *                   type: string
 *                 atualizado:
 *                   $ref: '#/components/schemas/Manutencao'
 *       400:
 *         description: Dados invalidos.
 *       404:
 *         description: Manutencao nao encontrada.
 */
router.put('/:id', manutencoesController.atualizarManutencao);

/**
 * @swagger
 * /manutencoes/{id}/fechar:
 *   patch:
 *     summary: Conclui a manutencao e marca a maquina como ativa.
 *     tags: [Manutencoes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Manutencao encerrada.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 mensagem:
 *                   type: string
 *                 fechado:
 *                   $ref: '#/components/schemas/Manutencao'
 *       404:
 *         description: Manutencao nao encontrada.
 */
router.patch('/:id/fechar', manutencoesController.fecharManutencao);

/**
 * @swagger
 * /manutencoes/{id}:
 *   delete:
 *     summary: Remove uma manutencao.
 *     tags: [Manutencoes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Registro removido.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MensagemResponse'
 *       404:
 *         description: Manutencao nao encontrada.
 */
router.delete('/:id', manutencoesController.removerManutencao);

export default router;
