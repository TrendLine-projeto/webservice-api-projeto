import * as FornecedorSupriModel from '../../models/fornecedorSupri';
import * as NotificacoesService from '../notificacoes/notificacoes';

const criarNotificacaoFornecedorSupri = async (
    acao: 'Criacao' | 'Edicao' | 'Alteracao',
    payload: { idCliente?: number; razaoSocial?: string },
    idFornecedor?: number
) => {
    if (!payload?.idCliente) return;
    const nome = payload.razaoSocial || (idFornecedor ? `fornecedor ${idFornecedor}` : 'fornecedor');
    await NotificacoesService.criar({
        descricao: `${acao} de fornecedor de suprimentos: ${nome}`,
        url: '/fornecedoressuprimentos',
        tipo: acao,
        idCliente: Number(payload.idCliente)
    });
};

export const criarFornecedor = async (fornecedor: any) => {
    if (!fornecedor.razaoSocial || !fornecedor.cnpj || !fornecedor.cliente_id) {
        throw { tipo: 'Validacao', mensagem: 'RazÃ£o Social, CNPJ e Cliente ID sÃ£o obrigatÃ³rios.' };
    }

    const clienteExiste = await FornecedorSupriModel.verificarClientePorId(fornecedor.cliente_id);

    if (!clienteExiste) {
        throw { tipo: 'ClienteNaoEncontrado', mensagem: 'Cliente não encontrado. Verifique o ID informado.' };
    }

    const resultado = await FornecedorSupriModel.inserirFornecedor(fornecedor);
    await criarNotificacaoFornecedorSupri('Criacao', {
        idCliente: fornecedor.cliente_id,
        razaoSocial: fornecedor.razaoSocial
    }, resultado.insertId);

    return {
        id: resultado.insertId,
        ...fornecedor
    };
};

export const buscarFornecedoresPorCliente = async (filtros: any) => {
    if (!filtros.cliente_id) {
        throw { tipo: 'Validacao', mensagem: 'Cliente ID Ã© obrigatÃ³rio.' };
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
        throw { tipo: 'Validacao', mensagem: 'Cliente ID Ã© obrigatÃ³rio.' };
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

export const editarFornecedor = async (id: number, dados: any) => {
    const existente = await FornecedorSupriModel.buscarFornecedorPorId(id);
    const sucesso = await FornecedorSupriModel.editarFornecedor(id, dados);
    if (sucesso?.sucesso) {
        const fornecedor = existente.fornecedoresResult?.[0];
        await criarNotificacaoFornecedorSupri('Edicao', {
            idCliente: dados.cliente_id ?? fornecedor?.cliente_id,
            razaoSocial: dados.razaoSocial ?? fornecedor?.razaoSocial
        }, id);
    }
    return {
        success: sucesso
    };
};

export const deletarFornecedor = async (id: number): Promise<{ success: boolean; mensagem: string }> => {
    const existente = await FornecedorSupriModel.buscarFornecedorPorId(id);
    const { sucesso, linhasAfetadas } = await FornecedorSupriModel.deletarFornecedor(id);

    if (!sucesso || linhasAfetadas === 0) {
        return {
            success: false,
            mensagem: 'Fornecedor nÇœo encontrado ou jÇ­ excluÇðdo.'
        };
    }

    const fornecedor = existente.fornecedoresResult?.[0];
    if (fornecedor) {
        await criarNotificacaoFornecedorSupri('Alteracao', {
            idCliente: fornecedor.cliente_id,
            razaoSocial: fornecedor.razaoSocial
        }, id);
    }

    return {
        success: true,
        mensagem: 'Fornecedor excluÇðdo com sucesso!'
    };
};

