import { Request, Response } from 'express';
import * as TipoProdutosService from '../service/tipos_produtos/tipos_produtos';

export const tiposProdutoPorCategoria = async (req: Request, res: Response) => {
  try {
    const { categoria } = req.query;

    if (!categoria || typeof categoria !== 'string') {
      return res.status(400).json({ mensagem: 'Categoria é obrigatória e deve ser uma string.' });
    }

    const tipos = await TipoProdutosService.buscarTiposPorCategoria(categoria);

    return res.status(200).json({ mensagem: 'Tipos de produto encontrados com sucesso!', tipos });
  } catch (error: any) {
    return res.status(500).json({ mensagem: 'Erro interno no servidor.', erro: error.message || error });
  }
};

export const buscarConferenciaEstoqueController = async (req: Request, res: Response) => {
  try {
    const { tabela, idCliente, pagina = 1, quantidadePorPagina = 10 } = req.body;

    if (!tabela || !idCliente) {
      return res.status(400).json({ mensagem: 'Parâmetros obrigatórios ausentes' });
    }

    const result = await TipoProdutosService.buscarConferenciaEstoqueService({
      tabela,
      idCliente: Number(idCliente),
      pagina,
      quantidadePorPagina
    });

    res.status(200).json(result);
  } catch (error) {
    console.error('Erro na conferência:', error);
    res.status(500).json({ mensagem: 'Erro ao buscar dados de conferência.' });
  }
};


export const salvarConferencia = async (req: Request, res: Response) => {
    try {
        const resultado = await TipoProdutosService.registrarConferencia(req.body);
        return res.status(200).json({ mensagem: 'Conferência registrada com sucesso', resultado });
    } catch (error: any) {
        console.error(error);
        return res.status(400).json({ mensagem: error.message || 'Erro ao registrar conferência' });
    }
};