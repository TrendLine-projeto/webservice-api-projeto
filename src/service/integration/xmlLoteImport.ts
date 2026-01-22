import { XMLParser } from 'fast-xml-parser';
import { toNum } from '../../shared/num';
import * as lotesService from '../lotes/lotesBase';
import * as integrationLotesModel from '../../models/integrationLotes';
import * as NotificacoesService from '../notificacoes/notificacoes';
import { EntradaDeLote } from '../../types/lotes/EntradaDeLote';
import { NotaFiscal } from '../../types/notasFiscais/notaFiscal';

type LoteImportResult = {
  idLote: number;
  idFilial: number;
  idFornecedor: number;
  numeroIdentificador: string;
  totalProdutos: number;
};

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  parseTagValue: false,
  trimValues: true,
});

const asArray = <T>(value: T | T[] | null | undefined) =>
  Array.isArray(value) ? value : value ? [value] : [];

const normalizeCnpj = (value: string) => value.replace(/\D/g, '');
const toText = (value: any) => (value === undefined || value === null ? '' : String(value).trim());

const toMysqlDateTime = (value: any) => {
  if (!value) return '';
  const raw = String(value).trim();
  if (!raw) return '';

  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return `${raw} 00:00:00`;
  }

  if (/^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}$/.test(raw)) {
    return raw;
  }

  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 19).replace('T', ' ');
};

const findNode = (root: any, key: string): any => {
  if (!root || typeof root !== 'object') return null;
  const queue: any[] = [root];

  while (queue.length) {
    const current = queue.shift();
    if (!current || typeof current !== 'object') continue;
    if (Object.prototype.hasOwnProperty.call(current, key)) {
      return current[key];
    }
    for (const value of Object.values(current)) {
      if (value && typeof value === 'object') {
        queue.push(value);
      }
    }
  }

  return null;
};

const getDocumento = (node: any) => toText(node?.CNPJ || node?.CPF || '');

const resolveChaveAcesso = (data: any, infNFe: any) => {
  const id = toText(infNFe?.Id || infNFe?.['@_Id']);
  if (id) return id.replace(/^NFe/, '');

  const protNFe = findNode(data, 'protNFe');
  const chNFe = toText(protNFe?.infProt?.chNFe);
  return chNFe || '';
};

const resolveNumeroIdentificador = (data: any, infNFe: any) => {
  const chave = resolveChaveAcesso(data, infNFe);
  if (chave) return chave;

  const ide = infNFe?.ide || {};
  const nNF = toText(ide?.nNF);
  const serie = toText(ide?.serie);
  return [nNF, serie].filter(Boolean).join('-') || `NFE-${Date.now()}`;
};

const parseNotaFiscal = (data: any, infNFe: any): NotaFiscal => {
  const ide = infNFe?.ide || {};
  const total = infNFe?.total?.ICMSTot || {};
  const transp = infNFe?.transp || {};
  const transporta = transp?.transporta || {};

  const volumes = asArray(transp?.vol);
  const qtdVolumesSomado = volumes.reduce((acc, vol) => acc + (toNum(vol?.qVol) ?? 0), 0);
  const qtdVolumes = qtdVolumesSomado || (volumes.length ? volumes.length : 0);
  const pesoBruto = volumes.reduce((acc, vol) => {
    const peso = toNum(vol?.pesoB ?? vol?.pBruto ?? vol?.pesoBruto) ?? 0;
    return acc + peso;
  }, 0);

  const emissaoRaw = toText(ide?.dhEmi || ide?.dEmi || ide?.dhSaiEnt || ide?.dSaiEnt);
  const dataEmissao = toMysqlDateTime(emissaoRaw) || toMysqlDateTime(new Date());

  return {
    chaveAcesso: resolveChaveAcesso(data, infNFe),
    numeroNota: toText(ide?.nNF),
    serie: toText(ide?.serie),
    dataEmissao,
    valorProdutos: toNum(total?.vProd) ?? 0,
    valorFrete: toNum(total?.vFrete) ?? 0,
    valorICMS: toNum(total?.vICMS) ?? 0,
    valorIPI: toNum(total?.vIPI) ?? 0,
    transportadora: toText(transporta?.xNome || transporta?.xFant),
    qtdVolumes,
    pesoBruto,
  };
};

const criarNotificacaoLote = async (idCliente: number, numeroIdentificador: string) => {
  await NotificacoesService.criar({
    descricao: `Integracao de lote via XML: ${numeroIdentificador}`,
    url: '/lotes/lotesentradas',
    tipo: 'Integracao',
    idCliente: Number(idCliente),
  });
};

export const processarXmlParaLote = async (
  xmlRaw: string,
  clienteIdEsperado?: number
): Promise<LoteImportResult> => {
  const data = parser.parse(xmlRaw);
  const infNFe = findNode(data, 'infNFe');

  if (!infNFe) {
    throw new Error('infNFe nao encontrado no XML.');
  }

  const ide = infNFe?.ide || {};
  const emit = infNFe?.emit || {};
  const dest = infNFe?.dest || {};
  const total = infNFe?.total?.ICMSTot || {};

  const cnpjClienteRaw = getDocumento(dest);
  const cnpjFornecedorRaw = getDocumento(emit);

  if (!cnpjClienteRaw) {
    throw new Error('CNPJ do cliente nao encontrado no XML.');
  }
  if (!cnpjFornecedorRaw) {
    throw new Error('CNPJ do fornecedor nao encontrado no XML.');
  }

  const cnpjCliente = normalizeCnpj(cnpjClienteRaw);
  const cnpjFornecedor = normalizeCnpj(cnpjFornecedorRaw);

  const cliente = await integrationLotesModel.buscarClientePorCnpj(cnpjCliente);
  if (!cliente) {
    throw new Error(`Cliente nao encontrado para CNPJ ${cnpjClienteRaw}.`);
  }
  if (clienteIdEsperado && cliente.id !== clienteIdEsperado) {
    throw new Error(`XML pertence a outro cliente (id ${cliente.id}).`);
  }

  const filial = await integrationLotesModel.buscarFilialPorClienteId(cliente.id);
  if (!filial) {
    throw new Error(`Filial nao encontrada para cliente ${cliente.id}.`);
  }

  const fornecedor = await integrationLotesModel.buscarFornecedorPorCnpj(cliente.id, cnpjFornecedor);
  if (!fornecedor) {
    throw new Error(`Fornecedor nao encontrado para CNPJ ${cnpjFornecedorRaw}.`);
  }

  const numeroIdentificador = resolveNumeroIdentificador(data, infNFe);
  const nomeEntregador = toText(emit?.xNome || emit?.xFant);
  const nomeRecebedor = toText(dest?.xNome || dest?.xFant);
  const valorEstimado = toNum(total?.vNF ?? total?.vProd) ?? 0;

  const itens = asArray(infNFe?.det);
  const produtos = itens.map((item: any, idx: number) => {
    const prod = item?.prod || {};
    const numeroProduto =
      toText(prod?.cProd) || toText(item?.['@_nItem']) || `${numeroIdentificador}-${idx + 1}`;

    return {
      numeroIdentificador: numeroProduto,
      nomeProduto: toText(prod?.xProd) || 'Produto',
      tipoEstilo: toText(prod?.NCM),
      tamanho: toText(prod?.uCom),
      corPrimaria: '',
      corSecundaria: '',
      valorPorPeca: toNum(prod?.vUnCom ?? prod?.vUnTrib) ?? 0,
      quantidadeProduto: toNum(prod?.qCom ?? prod?.qTrib) ?? 0,
      descricaoCurta: toText(prod?.xProd),
      idFilial: filial.id,
    };
  });

  if (!produtos.length) {
    throw new Error('Nenhum produto encontrado no XML.');
  }

  const entradaDeLote: EntradaDeLote = {
    numeroIdentificador,
    nomeEntregador: nomeEntregador || 'Fornecedor',
    nomeRecebedor: nomeRecebedor || 'Cliente',
    valorEstimado,
    valorHoraEstimado: 0,
    loteIniciado: false,
    loteFinalizado: false,
    idFilial: filial.id,
    idFornecedor_producao: fornecedor.id,
    produtos,
  };

  const notaFiscal = parseNotaFiscal(data, infNFe);
  const loteCriado = await lotesService.criarLote(entradaDeLote, notaFiscal, {
    integrarNoBling: false,
  });

  await criarNotificacaoLote(cliente.id, numeroIdentificador);

  return {
    idLote: loteCriado.id,
    idFilial: filial.id,
    idFornecedor: fornecedor.id,
    numeroIdentificador,
    totalProdutos: produtos.length,
  };
};
