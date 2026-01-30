import * as ProdutosModel from '../../models/produtosProducao';
import * as AnexosModel from '../../models/anexos';
import { getSignedUrlFromUrl, uploadBuffer } from '../storage/s3';

export const anexarProduto = async (idProduto: number, file: Express.Multer.File) => {
  const produto = await ProdutosModel.buscarProdutoPorId(idProduto);
  if (!produto) {
    throw { tipo: 'NotFound', mensagem: 'Produto nao encontrado.' };
  }

  const upload = await uploadBuffer({
    buffer: file.buffer,
    contentType: file.mimetype,
    originalName: file.originalname,
    prefix: `produtos_producao/${idProduto}`,
    cacheControl: 'public, max-age=31536000, immutable',
  });

  const anexoId = await AnexosModel.inserirAnexoProduto(idProduto, upload.url);
  let urlAssinada = upload.url;
  try {
    urlAssinada = await getSignedUrlFromUrl(upload.url);
  } catch {
    urlAssinada = upload.url;
  }
  return { id: anexoId, url: upload.url, urlAssinada };
};

export const listarAnexosAssinados = async (idProduto: number, expiresInSeconds?: number) => {
  const produto = await ProdutosModel.buscarProdutoPorId(idProduto);
  if (!produto) {
    throw { tipo: 'NotFound', mensagem: 'Produto nao encontrado.' };
  }

  const anexos = await AnexosModel.buscarAnexosPorProdutoId(idProduto);
  return await Promise.all(
    anexos.map(async (anexo) => {
      let urlAssinada = anexo.url;
      try {
        urlAssinada = await getSignedUrlFromUrl(anexo.url, expiresInSeconds);
      } catch {
        urlAssinada = anexo.url;
      }
      return {
        id: anexo.id,
        url: anexo.url,
        urlAssinada,
      };
    })
  );
};
