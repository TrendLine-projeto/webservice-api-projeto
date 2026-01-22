import { Router } from 'express';
import * as integrationImapController from '../controllers/integrationImapController';

/**
 * @swagger
 * tags:
 *   name: IntegracaoImap
 *   description: Configuracao IMAP por cliente.
 * components:
 *   schemas:
 *     ImapConfigInput:
 *       type: object
 *       required:
 *         - cliente_id
 *         - host
 *         - user_email
 *         - password_encrypted
 *       properties:
 *         cliente_id:
 *           type: integer
 *         host:
 *           type: string
 *         port:
 *           type: integer
 *         secure:
 *           type: boolean
 *         user_email:
 *           type: string
 *         password_encrypted:
 *           type: string
 *         mailbox:
 *           type: string
 *         since_days:
 *           type: integer
 *         unseen_only:
 *           type: boolean
 *         mark_seen:
 *           type: boolean
 *         from_filter:
 *           type: string
 *         subject_contains:
 *           type: string
 *         max_results:
 *           type: integer
 *         parse_timeout_ms:
 *           type: integer
 *         store_password:
 *           type: boolean
 *         ativo:
 *           type: boolean
 */

const router = Router();

/**
 * @swagger
 * /integration/imap:
 *   post:
 *     summary: Cria configuracao IMAP para cliente.
 *     tags: [IntegracaoImap]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ImapConfigInput'
 *     responses:
 *       201:
 *         description: Configuracao criada.
 */
router.post('/imap', integrationImapController.criarConfiguracao);

/**
 * @swagger
 * /integration/imap/{id}:
 *   get:
 *     summary: Busca configuracao IMAP por id.
 *     tags: [IntegracaoImap]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Configuracao encontrada.
 *       404:
 *         description: Configuracao nao encontrada.
 */
router.get('/imap/:id', integrationImapController.buscarPorId);

/**
 * @swagger
 * /integration/imap/buscar:
 *   post:
 *     summary: Lista configuracoes IMAP por cliente.
 *     tags: [IntegracaoImap]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               cliente_id:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Configuracoes encontradas.
 */
router.post('/imap/buscar', integrationImapController.buscarPorCliente);

/**
 * @swagger
 * /integration/imap/cliente/{cliente_id}:
 *   get:
 *     summary: Retorna configuracao IMAP ativa do cliente.
 *     tags: [IntegracaoImap]
 *     parameters:
 *       - in: path
 *         name: cliente_id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Configuracao encontrada.
 *       404:
 *         description: Configuracao nao encontrada.
 */
router.get('/imap/cliente/:cliente_id', integrationImapController.buscarAtivaPorCliente);

/**
 * @swagger
 * /integration/imap/alterar/{id}:
 *   put:
 *     summary: Atualiza configuracao IMAP.
 *     tags: [IntegracaoImap]
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
 *         description: Configuracao atualizada.
 */
router.put('/imap/alterar/:id', integrationImapController.atualizarPorId);

/**
 * @swagger
 * /integration/imap/deletar/{id}:
 *   delete:
 *     summary: Remove configuracao IMAP.
 *     tags: [IntegracaoImap]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Configuracao removida.
 */
router.delete('/imap/deletar/:id', integrationImapController.deletarPorId);

/**
 * @swagger
 * /integration/imap/testar:
 *   post:
 *     summary: Testa a conexao IMAP.
 *     tags: [IntegracaoImap]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               cliente_id:
 *                 type: integer
 *               config_id:
 *                 type: integer
 *               host:
 *                 type: string
 *               port:
 *                 type: integer
 *               secure:
 *                 type: boolean
 *               user_email:
 *                 type: string
 *               password_encrypted:
 *                 type: string
 *               mailbox:
 *                 type: string
 *     responses:
 *       200:
 *         description: Conexao OK.
 *       400:
 *         description: Dados invalidos.
 *       500:
 *         description: Falha ao conectar.
 */
router.post('/imap/testar', integrationImapController.testarConexao);

export default router;
