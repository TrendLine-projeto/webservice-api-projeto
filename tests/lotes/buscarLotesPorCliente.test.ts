import request from 'supertest';
import app from '../../src/app';

describe('POST /lotes/entrada_lotes/buscar', () => {
  it('deve retornar os lotes de uma filial específica', async () => {
    const response = await request(app)
      .post('/lotes/entrada_lotes/buscar')
      .send({
        idFilial: 1
      });

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('totalRegistros');
    expect(response.body).toHaveProperty('lotes');
    expect(Array.isArray(response.body.lotes)).toBe(true);
  });
});
