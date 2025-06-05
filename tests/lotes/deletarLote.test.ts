import request from 'supertest';
import app from '../../src/app';

describe('DELETE /lotes/entrada_lotes/deletar/:id', () => {
  
  it('deve excluir o lote com sucesso quando finalizado e sem produtos pendentes', async () => {
    const response = await request(app)
      .delete('/lotes/entrada_lotes/deletar/2');

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('mensagem', 'Lote e produtos excluídos com sucesso');
  });

  it('deve retornar 400 quando o lote não está finalizado', async () => {
    const response = await request(app)
      .delete('/lotes/entrada_lotes/deletar/2');

    expect(response.statusCode).toBe(400);
    expect(response.body).toHaveProperty('mensagem', 'Lote não finalizado, não pode ser excluído');
  });

  it('deve retornar 400 quando existem produtos não finalizados', async () => {
    const response = await request(app)
      .delete('/lotes/entrada_lotes/deletar/2');

    expect(response.statusCode).toBe(400);
    expect(response.body).toHaveProperty('mensagem', 'Existem produtos não finalizados neste lote');
  });

  it('deve retornar 404 quando o lote não for encontrado', async () => {
    const response = await request(app)
      .delete('/lotes/entrada_lotes/deletar/99999');

    expect(response.statusCode).toBe(404);
    expect(response.body).toHaveProperty('mensagem', 'Lote não encontrado');
  });

  it('deve retornar 400 para ID inválido', async () => {
    const response = await request(app)
      .delete('/lotes/entrada_lotes/deletar/abc');

    expect(response.statusCode).toBe(400);
    expect(response.body).toHaveProperty('mensagem', 'ID do lote inválido');
  });

});
