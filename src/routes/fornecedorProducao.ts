import { Router } from 'express';
import * as FornecedorProducaoController from '../controllers/fornecedorProducaoController';
import * as login from '../middleware/login';

const router = Router();

router.get('/fornecedores_producao/:id', FornecedorProducaoController.buscarFornecedorPorId);
router.post('/fornecedores_producao', FornecedorProducaoController.criarFornecedor);
router.post('/fornecedores_producao/buscar', FornecedorProducaoController.buscarFornecedoresPorCliente);
router.post('/fornecedores_producao/lista_simples', FornecedorProducaoController.buscarFornecedoresSimplesPorCliente);
router.delete('/fornecedores_producao/deletar/:id', FornecedorProducaoController.deletarFornecedor);

export default router;