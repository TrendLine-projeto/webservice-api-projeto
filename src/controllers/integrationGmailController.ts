import { Request, Response } from 'express';
import { importarGmailXml, importarGmailXmlTodas } from '../service/integration/gmailImport';

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
    return res.status(status).send({
      mensagem: error?.message || 'Erro ao importar XML do Gmail',
      detalhes: error?.detalhes || undefined,
    });
  }
};
