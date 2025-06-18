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