import { Router } from 'express';
import * as produtosProducaoController from '../controllers/producaoProdutosController';
import * as login from '../middleware/login';

const router = Router();

router.post('/produtos_producao', produtosProducaoController.criarProduto);
router.post('/produtos_producao/buscar', produtosProducaoController.buscarProdutosPorCliente);
router.get('/produtos_producao/:id', produtosProducaoController.buscarProdutoPorId);
router.put('/produtos_producao/alterar/:id', produtosProducaoController.atualizarProdutoPorId);
router.delete('/produtos_producao/deletar/:id', produtosProducaoController.deletarPorId);

export default router;