import { Router } from 'express';
import * as EstoqueMateriaPrimaController from '../controllers/estoqueMateriaPrimaController';
import * as login from '../middleware/login';

const router = Router();

router.get('/estoque_materiaprima/:id', EstoqueMateriaPrimaController.estoquemateriaprimaPorId);
router.post("/estoque_materiaprima/lista_por_fornecedor", EstoqueMateriaPrimaController.buscarPorFornecedor);
router.post('/estoque_materiaprima', EstoqueMateriaPrimaController.criarMateriaPrima);
router.post('/estoque_materiaprima/buscar', EstoqueMateriaPrimaController.buscarMateriaisPorFornecedor);
router.put('/estoque_materiaprima/editar/:id', EstoqueMateriaPrimaController.atualizarMateriaPrima);
router.delete('/estoque_materiaprima/deletar/:id', EstoqueMateriaPrimaController.excluirPorId);

export default router;