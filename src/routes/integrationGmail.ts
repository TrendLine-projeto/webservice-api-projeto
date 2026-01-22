import { Router } from 'express';
import * as integrationGmailController from '../controllers/integrationGmailController';

/**
 * @swagger
 * tags:
 *   name: IntegracaoGmail
 *   description: Importacao de XML via Gmail (IMAP).
 * components:
 *   schemas:
 *     GmailImportResumo:
 *       type: object
 *       properties:
 *         totalMensagens:
 *           type: integer
 *         processadas:
 *           type: integer
 *         novas:
 *           type: integer
 *         duplicadas:
 *           type: integer
 *         semXml:
 *           type: integer
 *         erros:
 *           type: integer
 *     GmailImportResponse:
 *       type: object
 *       properties:
 *         mensagem:
 *           type: string
 *         resumo:
 *           $ref: '#/components/schemas/GmailImportResumo'
 */

const router = Router();

/**
 * @swagger
 * /integration/gmail/importar:
 *   post:
 *     summary: Importa anexos XML via IMAP e grava na tabela integrations_gmail_xml.
 *     tags: [IntegracaoGmail]
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
 *               todas:
 *                 type: boolean
 *                 description: Quando true, importa todas as configuracoes ativas do cliente.
 *     responses:
 *       200:
 *         description: Importacao concluida.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GmailImportResponse'
 *       400:
 *         description: Configuracao obrigatoria ausente.
 *       500:
 *         description: Erro interno.
 */
router.post('/gmail/importar', integrationGmailController.importarXmlDoGmail);

export default router;
