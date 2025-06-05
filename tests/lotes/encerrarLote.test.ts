import request from 'supertest';
import app from '../../src/app';

describe('POST /lotes/entrada_lotes/encerarLote', () => {

    it('deve encerrar o lote com sucesso quando todos os produtos estão finalizados', async () => {
        const response = await request(app)
            .post('/lotes/entrada_lotes/encerarLote')
            .send({
                idEntrada_lotes: 1
            });

        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveProperty('mensagem', 'Lote encerrado com sucesso');
    });

    it('deve retornar erro 400 se há produtos em aberto para o lote', async () => {
        const response = await request(app)
            .post('/lotes/entrada_lotes/encerarLote')
            .send({
                idEntrada_lotes: 2  
            });

        expect(response.statusCode).toBe(400);
        expect(response.body).toHaveProperty('mensagem', 'Há produtos em aberto ainda para esse lote');
    });

    it('deve retornar erro 400 se não enviar idEntrada_lotes', async () => {
        const response = await request(app)
            .post('/lotes/entrada_lotes/encerarLote')
            .send({});  // Sem ID

        expect(response.statusCode).toBe(400);
        expect(response.body).toHaveProperty('mensagem', 'ID do lote é obrigatório');
    });

});
