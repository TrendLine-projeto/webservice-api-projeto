import { Router } from 'express';
import * as FornecedorSupriController from '../controllers/fornecedorSupriController';
import * as login from '../middleware/login';

const router = Router();

router.get('/fornecedores_suprimentos/:id', FornecedorSupriController.buscarFornecedorPorId);
router.post('/fornecedores_suprimentos', FornecedorSupriController.criarFornecedor);
router.post('/fornecedores_suprimentos/buscar', FornecedorSupriController.buscarFornecedoresPorCliente);
router.post('/fornecedores_suprimentos/lista_simples', FornecedorSupriController.buscarFornecedoresSimplesPorCliente);

export default router;