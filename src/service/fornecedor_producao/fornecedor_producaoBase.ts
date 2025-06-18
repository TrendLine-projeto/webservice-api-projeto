import * as FornecedorProducaoModel from '../../models/fornecedorProducao';

export const buscarFornecedorPorId = async (id: number) => {
    const { fornecedoresResult } = await FornecedorProducaoModel.buscarFornecedorPorId(id);

    return {
        totalRegistros: fornecedoresResult.length,
        fornecedor: fornecedoresResult[0] || null
    };
};

export const criarFornecedor = async (fornecedor: any) => {
    if (!fornecedor.razaoSocial || !fornecedor.cnpj || !fornecedor.cliente_id) {
        throw { tipo: 'Validacao', mensagem: 'Razão Social, CNPJ e Cliente ID são obrigatórios.' };
    }

    const clienteExiste = await FornecedorProducaoModel.verificarClientePorId(fornecedor.cliente_id);

    if (!clienteExiste) {
        throw { tipo: 'ClienteNaoEncontrado', mensagem: 'Cliente não encontrado. Verifique o ID informado.' };
    }

    const resultado = await FornecedorProducaoModel.inserirFornecedor(fornecedor);

    return {
        id: resultado.insertId,
        ...fornecedor
    };
};

export const buscarFornecedoresPorCliente = async (filtros: any) => {
    const {
        cliente_id,
        pagina = 1,
        quantidadePorPagina = 10,
        razaoSocial,
        cidade,
        estado,
        ativo,
        tipoFornecedor
    } = filtros;

    if (!cliente_id) {
        throw { tipo: 'Validacao', mensagem: 'Cliente ID é obrigatório.' };
    }

    const totalRegistros = await FornecedorProducaoModel.buscarTotalDeFornecedores({
        cliente_id,
        razaoSocial,
        cidade,
        estado,
        ativo,
        tipoFornecedor
    });

    if (totalRegistros === 0) {
        return {
            totalRegistros: 0,
            paginaAtual: pagina,
            quantidadePorPagina,
            fornecedores: []
        };
    }

    const fornecedores = await FornecedorProducaoModel.buscarListaDeFornecedores({
        cliente_id,
        pagina,
        quantidadePorPagina,
        razaoSocial,
        cidade,
        estado,
        ativo,
        tipoFornecedor
    });

    return {
        totalRegistros,
        paginaAtual: pagina,
        quantidadePorPagina,
        fornecedores
    };
};

export const buscarFornecedoresSimplesPorCliente = async ({ cliente_id }: { cliente_id: number }) => {
    if (!cliente_id) {
        throw { tipo: 'Validacao', mensagem: 'Cliente ID é obrigatório.' };
    }

    const fornecedores = await FornecedorProducaoModel.buscarFornecedoresSimplesPorCliente(cliente_id);
    return fornecedores;
};

export const deletarFornecedor = async (id: number): Promise<{ success: boolean; mensagem: string }> => {
    const { sucesso, linhasAfetadas } = await FornecedorProducaoModel.deletarFornecedor(id);

    if (!sucesso || linhasAfetadas === 0) {
        return {
            success: false,
            mensagem: 'Fornecedor não encontrado ou já excluído.'
        };
    }

    return {
        success: true,
        mensagem: 'Fornecedor excluído com sucesso!'
    };
};