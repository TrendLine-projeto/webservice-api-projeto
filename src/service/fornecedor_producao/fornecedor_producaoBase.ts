import * as FornecedorProducaoModel from '../../models/fornecedorProducao';
import * as NotificacoesService from '../notificacoes/notificacoes';

const criarNotificacaoFornecedorProducao = async (
    acao: 'Criacao' | 'Alteracao',
    payload: { idCliente?: number; razaoSocial?: string },
    idFornecedor?: number
) => {
    if (!payload?.idCliente) return;
    const nome = payload.razaoSocial || (idFornecedor ? `fornecedor ${idFornecedor}` : 'fornecedor');
    await NotificacoesService.criar({
        descricao: `${acao} de fornecedor de producao: ${nome}`,
        url: '/fornecedoresprodutos',
        tipo: acao,
        idCliente: Number(payload.idCliente)
    });
};

export const buscarFornecedorPorId = async (id: number) => {
    const { fornecedoresResult } = await FornecedorProducaoModel.buscarFornecedorPorId(id);

    return {
        totalRegistros: fornecedoresResult.length,
        fornecedor: fornecedoresResult[0] || null
    };
};

export const criarFornecedor = async (fornecedor: any) => {
    if (!fornecedor.razaoSocial || !fornecedor.cnpj || !fornecedor.cliente_id) {
        throw { tipo: 'Validacao', mensagem: 'RazÃ£o Social, CNPJ e Cliente ID sÃ£o obrigatÃ³rios.' };
    }

    const clienteExiste = await FornecedorProducaoModel.verificarClientePorId(fornecedor.cliente_id);

    if (!clienteExiste) {
        throw { tipo: 'ClienteNaoEncontrado', mensagem: 'Cliente não encontrado. Verifique o ID informado.' };
    }

    const resultado = await FornecedorProducaoModel.inserirFornecedor(fornecedor);
    await criarNotificacaoFornecedorProducao('Criacao', {
        idCliente: fornecedor.cliente_id,
        razaoSocial: fornecedor.razaoSocial
    }, resultado.insertId);

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
        throw { tipo: 'Validacao', mensagem: 'Cliente ID Ã© obrigatÃ³rio.' };
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
        throw { tipo: 'Validacao', mensagem: 'Cliente ID Ã© obrigatÃ³rio.' };
    }

    const fornecedores = await FornecedorProducaoModel.buscarFornecedoresSimplesPorCliente(cliente_id);
    return fornecedores;
};

export const deletarFornecedor = async (id: number): Promise<{ success: boolean; mensagem: string }> => {
    const existente = await FornecedorProducaoModel.buscarFornecedorPorId(id);
    const { sucesso, linhasAfetadas } = await FornecedorProducaoModel.deletarFornecedor(id);

    if (!sucesso || linhasAfetadas === 0) {
        return {
            success: false,
            mensagem: 'Fornecedor nÇœo encontrado ou jÇ­ excluÇðdo.'
        };
    }

    const fornecedor = existente.fornecedoresResult?.[0];
    if (fornecedor) {
        await criarNotificacaoFornecedorProducao('Alteracao', {
            idCliente: fornecedor.cliente_id,
            razaoSocial: fornecedor.razaoSocial
        }, id);
    }

    return {
        success: true,
        mensagem: 'Fornecedor excluÇðdo com sucesso!'
    };
};

