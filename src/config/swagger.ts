import swaggerJSDoc from 'swagger-jsdoc';

const swaggerDefinition = {
  openapi: '3.0.3',
  info: {
    title: 'Lotefy API',
    version: '1.0.0',
    description: 'Documentação da API Lotefy gerada a partir dos comentários JSDoc nas rotas.',
  },
  servers: [
    {
      url: `http://localhost:${process.env.PORT || 3450}`,
      description: 'Servidor padrão',
    },
    {
      url: 'https://webservice-api-projeto-production.up.railway.app',
      description: 'Servidor de produção',
    }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      MensagemResponse: {
        type: 'object',
        properties: {
          mensagem: { type: 'string' },
        },
      },
      ErroPadrao: {
        type: 'object',
        properties: {
          mensagem: { type: 'string' },
          erro: { type: 'object' },
        },
      },
      PaginacaoMeta: {
        type: 'object',
        properties: {
          total: { type: 'integer' },
          pagina: { type: 'integer' },
          quantidadePorPagina: { type: 'integer' },
        },
      },
    },
  },
};

const options = {
  definition: swaggerDefinition,
  apis: [
    './src/routes/**/*.ts',
  ],
};

const swaggerSpecs = swaggerJSDoc(options);

export default swaggerSpecs;
