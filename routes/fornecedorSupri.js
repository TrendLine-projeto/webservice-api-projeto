const express = require('express');
const router = express.Router();
const FornecedorSupriController = require('../controllers/fornecedorSupriController');
const login = require('../middleware/login');

router.post('/fornecedores_suprimentos', FornecedorSupriController.criarFornecedor);
router.post('/fornecedores_suprimentos/buscar', FornecedorSupriController.buscarFornecedoresPorCliente);
router.post('/fornecedores_suprimentos/lista_simples', FornecedorSupriController.buscarFornecedoresSimplesPorCliente);

module.exports = router;