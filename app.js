const express = require('express');
const app = express();
const morgan = require('morgan');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger.json');

const rotaUsuarios = require('./routes/usuarios');
const rotaFornecedorSupri = require('./routes/fornecedorSupri');
const rotaProdutoSupri = require('./routes/produtosSupri');
const rotaFornecedorProd = require('./routes/fornecedorProducao');

app.use(morgan('dev'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use(cors({
    methods: ['GET', 'POST', 'DELETE', 'UPDATE', 'PUT', 'PATCH'],
    origin: '*',
}));

app.use((req, res, next) => {
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

app.use((req, res, next) => {
    const erro = new Error('Rota não encontrado');
    erro.status = 404;
    next(erro);
});

app.use((error, req, res, next) => {
    res.status(error.status || 500);
    return res.send({
        erro: {
            mensagem: error.message
        }
    });
});

module.exports = app;
