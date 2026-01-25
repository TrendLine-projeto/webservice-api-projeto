import { Request, Response } from 'express';
import * as dashboardService from '../service/dashboard/dashboard';

export const obterCards = async (req: Request, res: Response) => {
  const idFornecedor = Number(req.query.idFornecedor_producao);
  const dataEntradaDe = req.query.dataEntradaDe as string | undefined;
  const dataEntradaAte = req.query.dataEntradaAte as string | undefined;

  if (!idFornecedor || Number.isNaN(idFornecedor)) {
    return res.status(400).send({ mensagem: 'idFornecedor_producao e obrigatorio' });
  }

  try {
    const data = await dashboardService.obterCards(idFornecedor, dataEntradaDe, dataEntradaAte);
    return res.status(200).send(data);
  } catch (error: any) {
    const status = error.status || 500;
    return res.status(status).send({ mensagem: error.mensagem || 'Erro interno' });
  }
};

export const obterSerieMensal = async (req: Request, res: Response) => {
  const idFornecedor = Number(req.query.idFornecedor_producao);
  const meses = Number(req.query.meses ?? 6);
  const dataEntradaDe = req.query.dataEntradaDe as string | undefined;
  const dataEntradaAte = req.query.dataEntradaAte as string | undefined;

  if (!idFornecedor || Number.isNaN(idFornecedor)) {
    return res.status(400).send({ mensagem: 'idFornecedor_producao e obrigatorio' });
  }

  try {
    const data = await dashboardService.obterSerieMensal(
      idFornecedor,
      meses,
      dataEntradaDe,
      dataEntradaAte
    );
    return res.status(200).send(data);
  } catch (error: any) {
    const status = error.status || 500;
    return res.status(status).send({ mensagem: error.mensagem || 'Erro interno' });
  }
};

export const obterOperacaoAlertas = async (req: Request, res: Response) => {
  const idCliente = Number(req.query.idCliente ?? req.query.idCliente);
  const dataEntradaDe = req.query.dataEntradaDe as string | undefined;
  const dataEntradaAte = req.query.dataEntradaAte as string | undefined;
  const idFilial = req.query.idFilial ? Number(req.query.idFilial) : undefined;
  const idFornecedor = req.query.idFornecedor_producao
    ? Number(req.query.idFornecedor_producao)
    : undefined;
  const limite = req.query.limite ? Number(req.query.limite) : undefined;
  const diasRisco = req.query.diasRisco ? Number(req.query.diasRisco) : undefined;

  if (!idCliente || Number.isNaN(idCliente)) {
    return res.status(400).send({ mensagem: 'idCliente e obrigatorio' });
  }

  try {
    const data = await dashboardService.obterOperacaoAlertas({
      idCliente,
      dataEntradaDe,
      dataEntradaAte,
      idFilial,
      idFornecedor,
      limite,
      diasRisco
    });
    return res.status(200).send(data);
  } catch (error: any) {
    const status = error.status || 500;
    return res.status(status).send({ mensagem: error.mensagem || 'Erro interno' });
  }
};
