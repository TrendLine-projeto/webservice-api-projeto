import { Router } from 'express';
import * as dashboardController from '../controllers/dashboardController';

/**
 * @swagger
 * tags:
 *   name: Dashboard
 *   description: Numeros e metricas para paines do sistema.
 */

const router = Router();

/**
 * @swagger
 * /dashboard/cards:
 *   get:
 *     summary: Retorna os cards principais do dashboard por fornecedor.
 *     tags: [Dashboard]
 *     parameters:
 *       - in: query
 *         name: idFornecedor_producao
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: dataEntradaDe
 *         required: false
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: dataEntradaAte
 *         required: false
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Cards do dashboard.
 *       400:
 *         description: Parametro obrigatorio ausente.
 */
router.get('/cards', dashboardController.obterCards);

/**
 * @swagger
 * /dashboard/serie-mensal:
 *   get:
 *     summary: Serie mensal de lotes e valores.
 *     tags: [Dashboard]
 *     parameters:
 *       - in: query
 *         name: idFornecedor_producao
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: dataEntradaDe
 *         required: false
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: dataEntradaAte
 *         required: false
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: meses
 *         required: false
 *         schema:
 *           type: integer
 *           default: 6
 *     responses:
 *       200:
 *         description: Serie mensal.
 *       400:
 *         description: Parametro obrigatorio ausente.
 */
router.get('/serie-mensal', dashboardController.obterSerieMensal);

export default router;
