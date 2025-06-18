import { Router } from 'express';
import * as EstoqueMateriaPrimaController from '../controllers/tipoProdutosController';
import * as login from '../middleware/login';

const router = Router();

router.get('/tipos_produto', EstoqueMateriaPrimaController.tiposProdutoPorCategoria);

export default router;