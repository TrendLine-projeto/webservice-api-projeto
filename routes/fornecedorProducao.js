const express = require('express');
const router = express.Router();
const FornecedorProducaoController = require('../controllers/fornecedorProducaoController');
const login = require('../middleware/login');

router.post('/fornecedores_producao', FornecedorProducaoController.criarFornecedor);
router.post('/fornecedores_producao/buscar', FornecedorProducaoController.buscarFornecedoresPorCliente);
router.post('/fornecedores_producao/lista_simples', FornecedorProducaoController.buscarFornecedoresSimplesPorCliente);

module.exports = router;