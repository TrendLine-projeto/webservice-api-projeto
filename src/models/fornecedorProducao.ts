import pool from '../connect/mysql';
import { PoolConnection, RowDataPacket } from 'mysql2/promise';
import { FiltrosFornecedor } from '../types/fornecedores/FiltroForcenedorer';

const construirWhereEParametros = (filtros: FiltrosFornecedor) => {
    let where = 'WHERE cliente_id = ?';
    const params: any[] = [filtros.cliente_id];

    if (filtros.razaoSocial) {
        where += ' AND razaoSocial LIKE ?';
        params.push(`%${filtros.razaoSocial}%`);
    }
    if (filtros.cidade) {
        where += ' AND cidade LIKE ?';
        params.push(`%${filtros.cidade}%`);
    }
    if (filtros.estado) {
        where += ' AND estado = ?';
        params.push(filtros.estado);
    }
    if (filtros.ativo !== null && filtros.ativo !== undefined) {
        where += ' AND ativo = ?';
        params.push(filtros.ativo);
    }
    if (filtros.tipoFornecedor) {
        where += ' AND tipoFornecedor = ?';
        params.push(filtros.tipoFornecedor);
    }

    return { where, params };
};

export const verificarClientePorId = async (cliente_id: number): Promise<boolean> => {
    const conn: PoolConnection = await pool.getConnection();
    try {
        const [rows] = await conn.query('SELECT id FROM clientes WHERE id = ?', [cliente_id]);
        return (rows as RowDataPacket[]).length > 0;
    } finally {
        conn.release();
    }
};

export const inserirFornecedor = async (fornecedor: any): Promise<any> => {
    const conn: PoolConnection = await pool.getConnection();
    try {
        const sql = `INSERT INTO fornecedores_producao (razaoSocial, cnpj, cliente_id) VALUES (?, ?, ?)`;
        const [result] = await conn.query(sql, [fornecedor.razaoSocial, fornecedor.cnpj, fornecedor.cliente_id]);
        return result;
    } finally {
        conn.release();
    }
};

export const buscarTotalDeFornecedores = async (filtros: FiltrosFornecedor): Promise<number> => {
    const conn: PoolConnection = await pool.getConnection();
    try {
        const { where, params } = construirWhereEParametros(filtros);
        const query = `SELECT COUNT(*) AS total FROM fornecedor_producao ${where}`;
        const [rows] = await conn.query<RowDataPacket[]>(query, params);
        return rows[0].total;
    } finally {
        conn.release();
    }
};

export const buscarListaDeFornecedores = async (filtros: FiltrosFornecedor): Promise<RowDataPacket[]> => {
    const conn: PoolConnection = await pool.getConnection();
    try {
        const { where, params } = construirWhereEParametros(filtros);
        const offset = ((filtros.pagina || 1) - 1) * (filtros.quantidadePorPagina || 10);

        const query = `
            SELECT 
                id, razaoSocial, nomeFantasia, cnpj, inscricaoEstadual, email, telefone, celular,
                responsavel, site, tipoFornecedor, categoria, endereco, bairro, cidade, estado,
                cep, pais, observacoes, ativo, dataCadastro
            FROM fornecedor_producao
            ${where}
            ORDER BY id DESC
            LIMIT ? OFFSET ?
        `;

        const result = await conn.query<RowDataPacket[]>(query, [
            ...params,
            filtros.quantidadePorPagina || 10,
            offset
        ]);

        return result[0];
    } finally {
        conn.release();
    }
};

export const buscarFornecedoresSimplesPorCliente = async (cliente_id: number): Promise<RowDataPacket[]> => {
    const conn: PoolConnection = await pool.getConnection();
    try {
        const query = `
            SELECT id, razaoSocial
            FROM fornecedor_producao
            WHERE cliente_id = ?
            ORDER BY razaoSocial ASC
        `;
        const [results] = await conn.query<RowDataPacket[]>(query, [cliente_id]);
        return results;
    } finally {
        conn.release();
    }
};