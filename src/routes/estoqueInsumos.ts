import { Router } from 'express';
import * as EstoqueInsumosController from '../controllers/estoqueInsumosController';
import * as login from '../middleware/login';

const router = Router();

router.get('/estoque_insumo/:id', EstoqueInsumosController.estoqueInsumosPorId);
router.post("/estoque_insumo/lista_por_fornecedor", EstoqueInsumosController.buscarPorFornecedor);
router.post('/estoque_insumo', EstoqueInsumosController.criarInsumo);
router.post('/estoque_insumo/buscar', EstoqueInsumosController.buscarInsumoPorFornecedor);
router.put('/estoque_insumo/editar/:id', EstoqueInsumosController.atualizarInsumo);
router.delete('/estoque_insumo/deletar/:id', EstoqueInsumosController.excluirPorId);

export default router;