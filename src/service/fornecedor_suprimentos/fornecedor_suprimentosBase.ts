import * as FornecedorSupriModel from '../../models/fornecedorSupri';

export const criarFornecedor = async (fornecedor: any) => {
    if (!fornecedor.razaoSocial || !fornecedor.cnpj || !fornecedor.cliente_id) {
        throw { tipo: 'Validacao', mensagem: 'Razão Social, CNPJ e Cliente ID são obrigatórios.' };
    }

    const clienteExiste = await FornecedorSupriModel.verificarClientePorId(fornecedor.cliente_id);

    if (!clienteExiste) {
        throw { tipo: 'ClienteNaoEncontrado', mensagem: 'Cliente não encontrado. Verifique o ID informado.' };
    }

    const resultado = await FornecedorSupriModel.inserirFornecedor(fornecedor);

    return {
        id: resultado.insertId,
        ...fornecedor
    };
};

export const buscarFornecedoresPorCliente = async (filtros: any) => {
    if (!filtros.cliente_id) {
        throw { tipo: 'Validacao', mensagem: 'Cliente ID é obrigatório.' };
    }

    const { totalResult, fornecedoresResult } = await FornecedorSupriModel.buscarFornecedoresPorCliente(filtros);

    const totalRegistros = (totalResult as any[])[0]?.total || 0;

    return {
        totalRegistros,
        fornecedores: fornecedoresResult
    };
};

export const buscarFornecedoresSimplesPorCliente = async (cliente_id: number) => {
    if (!cliente_id) {
        throw { tipo: 'Validacao', mensagem: 'Cliente ID é obrigatório.' };
    }

    const fornecedores = await FornecedorSupriModel.buscarFornecedoresSimplesPorCliente(cliente_id);
    return fornecedores;
};

export const buscarFornecedorPorId = async (id: number) => {
  const { fornecedoresResult } = await FornecedorSupriModel.buscarFornecedorPorId(id);

  return {
    totalRegistros: fornecedoresResult.length,
    fornecedor: fornecedoresResult[0] || null
  };
};