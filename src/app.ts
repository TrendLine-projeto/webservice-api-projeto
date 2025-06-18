import express, { Request, Response, NextFunction } from 'express';
import morgan from 'morgan';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import swaggerDocument from './swagger.json';

import rotaUsuarios from '../src/routes/usuarios';
import rotaFornecedorSupri from '../src/routes/fornecedorSupri';
import rotaProdutoSupri from '../src/routes/produtosSupri';
import rotaFornecedorProd from '../src/routes/fornecedorProducao';
import rotaLotes from '../src/routes/lotes';
import rotaProdutosProducao from '../src/routes/produtosProducao';
import rotaEstoqueMateriaPrima from '../src/routes/estoqueMateriaPrima';
import rotaInsumosTecnicos from '../src/routes/estoqueInsumos';
import rotaTipoProdutos from '../src/routes/tipoProdutos';

const app = express();

app.use(morgan('dev'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use(cors({
  methods: ['GET', 'POST', 'DELETE', 'UPDATE', 'PUT', 'PATCH'],
  origin: '*',
}));

app.use((req: Request, res: Response, next: NextFunction) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization'
  );

  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Allow-Methods', 'PUT, POST, PATCH, DELETE, GET');
    return res.status(200).send({});
  }
  next();
});

app.use('/swagger', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use('/usuarios', rotaUsuarios);
app.use('/fornecedorSupri', rotaFornecedorSupri);
app.use('/produtoSupri', rotaProdutoSupri);
app.use('/fornecedorProd', rotaFornecedorProd);
app.use('/lotes', rotaLotes);
app.use('/produtorProducao', rotaProdutosProducao);
app.use('/estoque', rotaEstoqueMateriaPrima);
app.use('/estoqueInsumos', rotaInsumosTecnicos);
app.use('/tipoProdutos', rotaTipoProdutos);

app.use((req: Request, res: Response, next: NextFunction) => {
  const erro = new Error('Rota não encontrado');
  (erro as any).status = 404;
  next(erro);
});

app.use((error: any, req: Request, res: Response, next: NextFunction) => {
  res.status(error.status || 500);
  res.send({
    erro: {
      mensagem: error.message
    }
  });
});

export default app;
