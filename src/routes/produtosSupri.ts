import { Router } from 'express';
import * as ProdutosSupriController from '../controllers/ProdutosSupriController';
import * as login from '../middleware/login';

const router = Router();

router.post('/produtos_suprimentos', ProdutosSupriController.criarProduto);
router.post('/produtos_suprimentos/buscar', ProdutosSupriController.buscarProdutosPorCliente);
router.post('/produtos_suprimentos/lista_simples', ProdutosSupriController.buscarProdutosSimplesPorFornecedor);

export default router;