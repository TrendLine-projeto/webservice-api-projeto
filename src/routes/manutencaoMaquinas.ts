// src/routes/manutencoesRouter.ts
import { Router } from 'express';
import * as manutencoesController from '../controllers/manutencaoMaquinasController';
import * as login from '../middleware/login';

const router = Router();

router.post('/', manutencoesController.criarManutencao);
router.get('/', manutencoesController.listarManutencoes);
router.get('/:id', manutencoesController.obterManutencao);
router.put('/:id', manutencoesController.atualizarManutencao);
router.patch('/:id/fechar', manutencoesController.fecharManutencao);
router.delete('/:id', manutencoesController.removerManutencao);

export default router;
