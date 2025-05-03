const express = require('express');
const router = express.Router();
const ProdutosSupriController = require('../controllers/ProdutosSupriController');
const login = require('../middleware/login');

router.post('/produtos_suprimentos', ProdutosSupriController.criarProduto);
router.post('/produtos_suprimentos/buscar', ProdutosSupriController.buscarProdutosPorCliente);
router.post('/produtos_suprimentos/lista_simples', ProdutosSupriController.buscarProdutosSimplesPorFornecedor);

module.exports = router;