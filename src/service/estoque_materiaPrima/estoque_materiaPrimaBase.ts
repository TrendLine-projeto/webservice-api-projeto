import * as EstoqueMateriaPrimaModel from '../../models/estoqueMateriaPrima';

export const estoquemateriaprimaPorId = async (id: number) => {
    const { materiaPrima } = await EstoqueMateriaPrimaModel.estoquemateriaprimaPorId(id);

    return {
        totalRegistros: materiaPrima.length,
        materiaPrima: materiaPrima[0] || null
    };
};

export const criarMateriaPrima = async (materiaPrima: any) => {
    if (!materiaPrima.nome || !materiaPrima.idFornecedor_suprimentos || !materiaPrima.idCliente) {
        throw { tipo: 'Validacao', mensagem: 'Nome, idCliente, e idFornecedor_suprimentos são obrigatórios.' };
    }

    const fornecedorSuprimentoExiste = await EstoqueMateriaPrimaModel.verificarFornecedorSuprimentosPorId(materiaPrima.idFornecedor_suprimentos);

    if (!fornecedorSuprimentoExiste) {
        throw { tipo: 'FornecedorsuprimentoNaoEncontrado', mensagem: 'Cliente não encontrado. Verifique o ID informado.' };
    }

    const resultado = await EstoqueMateriaPrimaModel.inserirMateriaPrima(materiaPrima);

    return {
        id: resultado.insertId,
        ...materiaPrima
    };
};

export const buscarPorFornecedorComFiltros = async (filtros: any) => {
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

  const totalRegistros = await EstoqueMateriaPrimaModel.buscarTotal({
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

  const materiais = await EstoqueMateriaPrimaModel.buscarLista({
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
  const resultado = await EstoqueMateriaPrimaModel.excluirPorId(id);
  return resultado.affectedRows > 0;
};

export const atualizar = async (id: number, dados: any): Promise<boolean> => {
  const existente = await EstoqueMateriaPrimaModel.buscarPorId(id);

  if (!existente) throw new Error("Material não encontrado.");
  if (existente.quantidade <= 0) throw new Error("Não é possível atualizar materiais com estoque zerado.");
  if (existente.fornecedorAtivo === false) throw new Error("Fornecedor inativo.");

  // Remover campos não permitidos ou adicionar campos obrigatórios
  dados.atualizadoEm = new Date();

  return await EstoqueMateriaPrimaModel.atualizar(id, dados);
};

export const buscarPorFornecedor = async (idFornecedor_suprimentos: number) => {
  return await EstoqueMateriaPrimaModel.buscarPorFornecedor(idFornecedor_suprimentos);
};