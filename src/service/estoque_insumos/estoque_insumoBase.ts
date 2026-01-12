import * as EstoqueInsumosModel from '../../models/estoqueInsumos';
import * as NotificacoesService from '../notificacoes/notificacoes';

const criarNotificacaoInsumo = async (
  acao: 'Criacao' | 'Edicao' | 'Alteracao',
  payload: { idCliente?: number; nome?: string },
  idInsumo?: number
) => {
  if (!payload?.idCliente) return;
  const nome = payload.nome || (idInsumo ? `insumo ${idInsumo}` : 'insumo');
  await NotificacoesService.criar({
    descricao: `${acao} de insumo tecnico: ${nome}`,
    url: '/suprimentos/insumostecnicos',
    tipo: acao,
    idCliente: Number(payload.idCliente)
  });
};

export const estoqueInsumosPorId = async (id: number) => {
    const { insumoTecnico } = await EstoqueInsumosModel.estoqueInsumosPorId(id);

    return {
        totalRegistros: insumoTecnico.length,
        insumoTecnico: insumoTecnico[0] || null
    };
};

export const criarInsumo = async (insumoTecnico: any) => {
    if (!insumoTecnico.nome || !insumoTecnico.idFornecedor_suprimentos || !insumoTecnico.idCliente) {
        throw { tipo: 'Validacao', mensagem: 'Nome, idCliente, e idFornecedor_suprimentos são obrigatórios.' };
    }

    const fornecedorSuprimentoExiste = await EstoqueInsumosModel.verificarFornecedorSuprimentosPorId(insumoTecnico.idFornecedor_suprimentos);

    if (!fornecedorSuprimentoExiste) {
        throw { tipo: 'FornecedorsuprimentoNaoEncontrado', mensagem: 'Cliente não encontrado. Verifique o ID informado.' };
    }

    const resultado = await EstoqueInsumosModel.inserirInsumoTecnico(insumoTecnico);
    await criarNotificacaoInsumo('Criacao', {
      idCliente: insumoTecnico.idCliente,
      nome: insumoTecnico.nome
    }, resultado.insertId);

    return {
        id: resultado.insertId,
        ...insumoTecnico
    };
};

export const buscarInsumoPorFornecedorComFiltros = async (filtros: any) => {
  const {
    idCliente,
    idFornecedor_suprimentos,
    pagina = 1,
    quantidadePorPagina = 10,
    nome,
    tipo,
    cor,
    marca,
    unidade,
    localArmazenamento
  } = filtros;

  const totalRegistros = await EstoqueInsumosModel.buscarTotal({
    idCliente,
    idFornecedor_suprimentos,
    nome,
    tipo,
    cor,
    marca,
    unidade,
    localArmazenamento
  });

  if (totalRegistros === 0) {
    return {
      totalRegistros: 0,
      paginaAtual: pagina,
      quantidadePorPagina,
      materiais: []
    };
  }

  const materiais = await EstoqueInsumosModel.buscarLista({
    idCliente,
    idFornecedor_suprimentos,
    pagina,
    quantidadePorPagina,
    nome,
    tipo,
    cor,
    marca,
    unidade,
    localArmazenamento
  });

  return {
    totalRegistros,
    paginaAtual: pagina,
    quantidadePorPagina,
    materiais
  };
};

export const excluirPorId = async (id: number): Promise<boolean> => {
  const existente = await EstoqueInsumosModel.buscarPorId(id);
  const resultado = await EstoqueInsumosModel.excluirPorId(id);
  if (resultado.affectedRows > 0 && existente) {
    await criarNotificacaoInsumo('Alteracao', {
      idCliente: existente.idCliente,
      nome: existente.nome
    }, id);
  }
  return resultado.affectedRows > 0;
};

export const atualizar = async (id: number, dados: any): Promise<boolean> => {
  const existente = await EstoqueInsumosModel.buscarPorId(id);

  if (!existente) throw new Error("Insumo tecnico não encontrado.");
  if (existente.quantidade <= 0) throw new Error("Não é possível atualizar o Insumo tecnico com estoque zerado.");
  if (existente.fornecedorAtivo === false) throw new Error("Fornecedor inativo.");

  // Remover campos não permitidos ou adicionar campos obrigatórios
  dados.atualizadoEm = new Date();

  const ok = await EstoqueInsumosModel.atualizar(id, dados);
  if (ok) {
    await criarNotificacaoInsumo('Edicao', {
      idCliente: existente.idCliente,
      nome: dados.nome ?? existente.nome
    }, id);
  }
  return ok;
};

export const buscarPorFornecedor = async (idFornecedor_suprimentos: number) => {
  return await EstoqueInsumosModel.buscarPorFornecedor(idFornecedor_suprimentos);
};
