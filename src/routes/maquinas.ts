// src/routes/maquinasRouter.ts
import { Router } from 'express';
import * as maquinasController from '../controllers/maquinasController';
import * as login from '../middleware/login';

const router = Router();

router.post('/', maquinasController.criarMaquina);
router.get('/', maquinasController.listarMaquinas);
router.get('/:id', maquinasController.obterMaquina);
router.put('/:id', maquinasController.atualizarMaquina);
router.delete('/:id', maquinasController.removerMaquina);

export default router;
