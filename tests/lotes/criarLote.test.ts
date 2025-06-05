import request from 'supertest';
import app from '../../src/app';

describe('POST /lotes/entrada_lotes', () => {
  it('deve criar um lote com sucesso', async () => {
    const response = await request(app)
      .post('/lotes/entrada_lotes')
      .send({
        numeroIdentificador: 'L123456',
        nomeEntregador: 'João da Silva',
        nomeRecebedor: 'Maria Oliveira',
        valorEstimado: 1500,
        valorHoraEstimado: 45,
        loteIniciado: true,
        idFilial: 1,
        produtos: [
          {
            nomeProduto: "Camiseta Polo",
            tipoEstilo: "Casual",
            tamanho: "M",
            corPrimaria: "Azul",
            valorPorPeca: 29.9,
            quantidadeProduto: 100,
            finalizado: 1
          }
        ]
      });

    expect(response.statusCode).toBe(201);
    expect(response.body).toHaveProperty('mensagem');
    expect(response.body).toHaveProperty('loteCadastrado');
  });

  it('deve retornar erro 400 se faltar idFilial', async () => {
    const response = await request(app)
      .post('/lotes/entrada_lotes')
      .send({
        numeroIdentificador: 'L123456',
        // idFilial omitido de propósito
      });

    expect(response.statusCode).toBe(400);
    expect(response.body).toHaveProperty('mensagem');
  });
});
