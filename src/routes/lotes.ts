import { Router } from 'express';
import * as lotesController from '../controllers/lotesController';
import * as login from '../middleware/login';

const router = Router();

router.post('/entrada_lotes', lotesController.criarLote);
router.post('/entrada_lotes/buscar', lotesController.buscarLotesPorCliente);
router.post('/entrada_lotes/encerarLote', lotesController.encerrarLote);
router.post('/entrada_lotes/reabrirLote', lotesController.reabrirLote);
router.get('/entrada_lotes/:id', lotesController.buscarLotePorId);
router.delete('/entrada_lotes/deletar/:id', lotesController.deletarPorId);

export default router;