import request from 'supertest';
import app from '../../src/app';

describe('GET /lotes/entrada_lotes/:id', () => {
  
  it('deve retornar o lote quando ID for válido e existente', async () => {
    const response = await request(app)
      .get('/lotes/entrada_lotes/2');

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('lote');
    expect(response.body.lote).toHaveProperty('id', 2);
  });

  it('deve retornar 404 quando o lote não for encontrado', async () => {
    const response = await request(app)
      .get('/lotes/entrada_lotes/99999')

    expect(response.statusCode).toBe(404);
    expect(response.body).toHaveProperty('mensagem', 'Lote não encontrado');
  });

  it('deve retornar 400 para ID inválido', async () => {
    const response = await request(app)
      .get('/lotes/entrada_lotes/abc');

    expect(response.statusCode).toBe(400);
    expect(response.body).toHaveProperty('mensagem', 'ID do lote inválido');
  });

});
