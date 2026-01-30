import { Request, Response } from 'express';
import { importarGmailXml, importarGmailXmlTodas } from '../service/integration/gmailImport';
import * as notasFiscaisModel from '../models/notaFiscal';
import * as gmailXmlModel from '../models/integrationsGmailXml';
type NodeSpedPdfModule = {
  DANFe: (options: { xml: string }) => Promise<Buffer | Uint8Array | string>;
  DANFCe: (options: { xml: string }) => Promise<Buffer | Uint8Array | string>;
};

let nodeSpedPdfModule: NodeSpedPdfModule | null = null;

const loadNodeSpedPdf = async (): Promise<NodeSpedPdfModule> => {
  if (!nodeSpedPdfModule) {
    const loader = new Function('return import("node-sped-pdf")');
    nodeSpedPdfModule = (await loader()) as NodeSpedPdfModule;
  }
  return nodeSpedPdfModule as NodeSpedPdfModule;
};

const normalizeXml = (xml: string) => String(xml || '').replace(/^\uFEFF/, '').trim();
const isNfeXml = (xml: string) => /<nfeProc\b|<NFe\b/i.test(xml);

const coercePdfBuffer = (data: Buffer | Uint8Array | string) => {
  if (Buffer.isBuffer(data)) return data;
  if (data instanceof Uint8Array) return Buffer.from(data);
  if (typeof data === 'string') {
    const trimmed = data.trim();
    const isBase64 = /^[A-Za-z0-9+/=\r\n]+$/.test(trimmed) && trimmed.length % 4 === 0;
    return isBase64 ? Buffer.from(trimmed, 'base64') : Buffer.from(data, 'binary');
  }
  return Buffer.from([]);
};

const obterXmlPorNotaFiscal = async (id: number) => {
  const nota = await notasFiscaisModel.buscarPorId(id);
  if (!nota) {
    throw { status: 404, message: 'Nota fiscal nao encontrada.' };
  }

  const integracaoId = (nota as any).integracao_gmail_xml_id ?? null;
  if (!integracaoId) {
    throw { status: 404, message: 'XML nao associado a esta nota fiscal.' };
  }

  const xmlRow = await gmailXmlModel.buscarPorId(Number(integracaoId));
  if (!xmlRow || !xmlRow.xml_raw) {
    throw { status: 404, message: 'XML nao encontrado.' };
  }

  const chave = (nota as any).chaveAcesso || id;
  return { xml: String(xmlRow.xml_raw), chave };
};

const gerarPdfNotaFiscal = async (xml: string) => {
  const { DANFe, DANFCe } = await loadNodeSpedPdf();
  try {
    return await DANFe({ xml });
  } catch (error) {
    return await DANFCe({ xml });
  }
};

export const importarXmlDoGmail = async (req: Request, res: Response) => {
  try {
    const clienteIdRaw = req.body?.cliente_id ?? req.query?.cliente_id;
    const configIdRaw = req.body?.config_id ?? req.query?.config_id;
    const todasRaw = req.body?.todas ?? req.query?.todas ?? req.body?.all ?? req.query?.all;
    const clienteId = Number(clienteIdRaw);
    const configId = configIdRaw !== undefined ? Number(configIdRaw) : undefined;
    const todas =
      typeof todasRaw === 'string'
        ? ['true', '1', 'sim', 'yes'].includes(todasRaw.toLowerCase())
        : Boolean(todasRaw);

    if (!clienteId || Number.isNaN(clienteId)) {
      return res.status(400).send({ mensagem: 'cliente_id e obrigatorio.' });
    }

    if (todas) {
      const resultado = await importarGmailXmlTodas(clienteId);
      return res.status(200).send({
        mensagem: 'Importacao concluida',
        resumo: resultado.resumo,
        detalhes: resultado.detalhes,
        totalConfiguracoes: resultado.totalConfiguracoes,
      });
    }

    const resumo = await importarGmailXml(clienteId, configId);
    return res.status(200).send({ mensagem: 'Importacao concluida', resumo });
  } catch (error: any) {
    const status = error?.status || 500;
    const mensagem = error?.message || 'Erro ao importar XML do Gmail';
    const detalhes = error?.detalhes || undefined;

    if (status >= 500) {
      return res.status(200).send({
        mensagem: 'Importacao concluida com erro',
        erro: mensagem,
        detalhes,
      });
    }

    return res.status(status).send({
      mensagem,
      detalhes,
    });
  }
};

export const baixarNotaFiscalXml = async (req: Request<{ id: string }>, res: Response) => {
  const id = Number(req.params.id);
  if (!id || Number.isNaN(id)) {
    return res.status(400).send({ mensagem: 'ID da nota fiscal invalido.' });
  }

  try {
    const { xml, chave } = await obterXmlPorNotaFiscal(id);
    const filename = `NF-${chave}.xml`;
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.status(200).send(xml);
  } catch (error: any) {
    const status = error?.status || 500;
    const mensagem = error?.message || 'Erro ao baixar XML da nota fiscal.';
    return res.status(status).send({ mensagem });
  }
};

export const baixarNotaFiscalPdf = async (req: Request<{ id: string }>, res: Response) => {
  const id = Number(req.params.id);
  if (!id || Number.isNaN(id)) {
    return res.status(400).send({ mensagem: 'ID da nota fiscal invalido.' });
  }

  try {
    const { xml: xmlRaw, chave } = await obterXmlPorNotaFiscal(id);
    const xml = normalizeXml(xmlRaw);

    if (!isNfeXml(xml)) {
      return res.status(422).send({ mensagem: 'XML nao parece ser de NFe/NFC-e valido.' });
    }

    const pdfData = await gerarPdfNotaFiscal(xml);
    const pdfBuffer = coercePdfBuffer(pdfData);
    const header = pdfBuffer.subarray(0, 8).toString('utf8');
    if (!pdfBuffer.length || !header.includes('%PDF')) {
      return res.status(422).send({ mensagem: 'Nao foi possivel gerar o PDF da nota fiscal.' });
    }
    const filename = `NF-${chave}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.status(200).send(pdfBuffer);
  } catch (error: any) {
    const status = error?.status || 500;
    const mensagem = error?.message || 'Erro ao gerar PDF da nota fiscal.';
    return res.status(status).send({ mensagem });
  }
};
