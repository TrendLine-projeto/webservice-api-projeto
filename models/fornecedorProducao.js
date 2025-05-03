const mysql = require('../connect/mysql').pool;

exports.criarFornecedor = (fornecedor, callback) => {
    mysql.getConnection((error, conn) => {
        if (error) return callback(error);

        const queryVerificaCliente = `SELECT id FROM clientes WHERE id = ?`;

        conn.query(queryVerificaCliente, [fornecedor.cliente_id], (error, resultsCliente) => {
            if (error) {
                conn.release();
                return callback(error);
            }

            if (resultsCliente.length === 0) {
                conn.release();
                return callback({
                    tipo: 'ClienteNaoEncontrado',
                    mensagem: 'Cliente não encontrado. Verifique o ID informado.'
                });
            }

            const queryInserirFornecedor = `
                INSERT INTO fornecedor_producao (
                    razaoSocial, nomeFantasia, cnpj, inscricaoEstadual, email, telefone, celular,
                    responsavel, site, tipoFornecedor, categoria, endereco, bairro, cidade, estado,
                    cep, pais, observacoes, ativo, cliente_id, dataCadastro
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
            `;

            const params = [
                fornecedor.razaoSocial,
                fornecedor.nomeFantasia,
                fornecedor.cnpj,
                fornecedor.inscricaoEstadual,
                fornecedor.email,
                fornecedor.telefone,
                fornecedor.celular,
                fornecedor.responsavel,
                fornecedor.site,
                fornecedor.tipoFornecedor,
                fornecedor.categoria,
                fornecedor.endereco,
                fornecedor.bairro,
                fornecedor.cidade,
                fornecedor.estado,
                fornecedor.cep,
                fornecedor.pais,
                fornecedor.observacoes,
                fornecedor.ativo ?? true,
                fornecedor.cliente_id
            ];

            conn.query(queryInserirFornecedor, params, (error, results) => {
                conn.release();
                if (error) return callback(error);
                callback(null, results);
            });
        });
    });
};

exports.buscarFornecedoresPorCliente = (filtros, callback) => {
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

    const offset = (pagina - 1) * quantidadePorPagina;

    let where = 'WHERE cliente_id = ?';
    const params = [cliente_id];

    if (razaoSocial) {
        where += ' AND razaoSocial LIKE ?';
        params.push(`%${razaoSocial}%`);
    }
    if (cidade) {
        where += ' AND cidade LIKE ?';
        params.push(`%${cidade}%`);
    }
    if (estado) {
        where += ' AND estado = ?';
        params.push(estado);
    }
    if (ativo !== null && ativo !== undefined) {
        where += ' AND ativo = ?';
        params.push(ativo);
    }
    if (tipoFornecedor) {
        where += ' AND tipoFornecedor = ?';
        params.push(tipoFornecedor);
    }

    const queryBusca = `
        SELECT 
            id, razaoSocial, nomeFantasia, cnpj, inscricaoEstadual, email, telefone, celular,
            responsavel, site, tipoFornecedor, categoria, endereco, bairro, cidade, estado,
            cep, pais, observacoes, ativo, dataCadastro
        FROM fornecedor_producao
        ${where}
        ORDER BY id DESC
        LIMIT ? OFFSET ?
    `;

    const queryTotal = `
        SELECT COUNT(*) AS total FROM fornecedor_producao
        ${where}
    `;

    mysql.getConnection((error, conn) => {
        if (error) return callback(error);

        conn.query(queryTotal, params, (error, totalResult) => {
            if (error) {
                conn.release();
                return callback(error);
            }

            conn.query(queryBusca, [...params, quantidadePorPagina, offset], (error, fornecedoresResult) => {
                conn.release();
                if (error) return callback(error);

                const totalRegistros = totalResult[0].total;
                callback(null, {
                    totalRegistros,
                    fornecedores: fornecedoresResult
                });
            });
        });
    });
};

exports.buscarFornecedoresSimplesPorCliente = (cliente_id, callback) => {
    mysql.getConnection((error, conn) => {
        if (error) return callback(error);

        const query = `
            SELECT id, razaoSocial
            FROM fornecedor_producao
            WHERE cliente_id = ?
            ORDER BY razaoSocial ASC
        `;

        conn.query(query, [cliente_id], (error, results) => {
            conn.release();
            if (error) return callback(error);
            callback(null, results);
        });
    });
};
