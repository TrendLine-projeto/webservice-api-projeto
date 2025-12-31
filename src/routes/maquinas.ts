// src/routes/maquinasRouter.ts
import { Router } from 'express';
import * as maquinasController from '../controllers/maquinasController';
import * as login from '../middleware/login';

/**
 * @swagger
 * tags:
 *   name: Maquinas
 *   description: Cadastro e acompanhamento do parque fabril.
 * components:
 *   schemas:
 *     MaquinaInput:
 *       type: object
 *       required:
 *         - codigo_interno
 *         - nome
 *         - numero_serie
 *         - idCliente
 *       properties:
 *         idCliente:
 *           type: integer
 *         codigo_interno:
 *           type: string
 *         nome:
 *           type: string
 *         descricao:
 *           type: string
 *         tipo:
 *           type: string
 *         setor:
 *           type: string
 *         fabricante:
 *           type: string
 *         modelo:
 *           type: string
 *         numero_serie:
 *           type: string
 *         status:
 *           type: string
 *           description: Enum esperado pelo banco (ex. ativa, em_manutencao).
 *     Maquina:
 *       allOf:
 *         - $ref: '#/components/schemas/MaquinaInput'
 *         - type: object
 *           properties:
 *             id:
 *               type: integer
 *             criado_em:
 *               type: string
 *               format: date-time
 */

const router = Router();

/**
 * @swagger
 * /maquinas:
 *   post:
 *     summary: Cadastra uma maquina.
 *     tags: [Maquinas]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/MaquinaInput'
 *     responses:
 *       201:
 *         description: Maquina criada.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 mensagem:
 *                   type: string
 *                 criado:
 *                   $ref: '#/components/schemas/Maquina'
 *       400:
 *         description: Dados invalidos.
 *       500:
 *         description: Erro inesperado.
 */
router.post('/', maquinasController.criarMaquina);

/**
 * @swagger
 * /maquinas:
 *   get:
 *     summary: Lista maquinas com filtros opcionais.
 *     tags: [Maquinas]
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
 *         name: busca
 *         schema:
 *           type: string
 *           description: Nome, codigo interno, numero de serie ou modelo.
 *       - in: query
 *         name: setor
 *         schema:
 *           type: string
 *       - in: query
 *         name: tipo
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: idCliente
 *         schema:
 *           type: integer
 *       - in: query
 *         name: fabricante
 *         schema:
 *           type: string
 *       - in: query
 *         name: modelo
 *         schema:
 *           type: string
 *       - in: query
 *         name: localizacao
 *         schema:
 *           type: string
 *       - in: query
 *         name: ano_fabricacao_de
 *         schema:
 *           type: integer
 *           description: Ano de fabricação mínimo (>=).
 *       - in: query
 *         name: ano_fabricacao_ate
 *         schema:
 *           type: integer
 *           description: Ano de fabricação máximo (<=).
 *       - in: query
 *         name: data_aquisicao_de
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: data_aquisicao_ate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: proxima_manutencao_ate
 *         schema:
 *           type: string
 *           format: date
 *           description: Próxima manutenção até a data informada (<=).
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
 *                     $ref: '#/components/schemas/Maquina'
 *       500:
 *         description: Erro ao listar.
 */
router.get('/', maquinasController.listarMaquinas);

/**
 * @swagger
 * /maquinas/{id}:
 *   get:
 *     summary: Recupera uma maquina pelo id.
 *     tags: [Maquinas]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Registro encontrado.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Maquina'
 *       404:
 *         description: Maquina nao encontrada.
 */
router.get('/:id', maquinasController.obterMaquina);

/**
 * @swagger
 * /maquinas/{id}:
 *   put:
 *     summary: Atualiza os dados de uma maquina.
 *     tags: [Maquinas]
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
 *             $ref: '#/components/schemas/MaquinaInput'
 *     responses:
 *       200:
 *         description: Maquina atualizada.
 *       400:
 *         description: Dados invalidos.
 *       404:
 *         description: Maquina nao encontrada.
 */
router.put('/:id', maquinasController.atualizarMaquina);

/**
 * @swagger
 * /maquinas/{id}:
 *   delete:
 *     summary: Remove uma maquina.
 *     tags: [Maquinas]
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
 *         description: Maquina nao encontrada.
 */
router.delete('/:id', maquinasController.removerMaquina);

export default router;
