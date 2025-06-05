import pool from '../connect/mysql';
import { PoolConnection, RowDataPacket } from 'mysql2/promise';

export const verificarClientePorId = async (cliente_id: number): Promise<boolean> => {
    const conn: PoolConnection = await pool.getConnection();
    try {
        const [rows] = await conn.query('SELECT id FROM clientes WHERE id = ?', [cliente_id]);
        return (rows as RowDataPacket[]).length > 0;
    } finally {
        conn.release();
    }
};

export const inserirFornecedor = async (fornecedor: any): Promise<{ insertId: number }> => {
    const conn: PoolConnection = await pool.getConnection();
    try {
        const query = `
      INSERT INTO fornecedor_suprimentos (
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

        const [result] = await conn.query(query, params);
        return result as { insertId: number };
    } finally {
        conn.release();
    }
};

export const buscarFornecedoresPorCliente = async (filtros: any): Promise<{ totalResult: RowDataPacket[]; fornecedoresResult: RowDataPacket[] }> => {
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
    const params: any[] = [cliente_id];

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
        FROM fornecedor_suprimentos
        ${where}
        ORDER BY id DESC
        LIMIT ? OFFSET ?
    `;

    const queryTotal = `
        SELECT COUNT(*) AS total
        FROM fornecedor_suprimentos
        ${where}
    `;

    const conn: PoolConnection = await pool.getConnection();
    try {
        const [totalResult] = await conn.query(queryTotal, params);
        const [fornecedoresResult] = await conn.query(queryBusca, [...params, quantidadePorPagina, offset]);

        return {
            totalResult: totalResult as RowDataPacket[],
            fornecedoresResult: fornecedoresResult as RowDataPacket[]
        };
    } catch (error) {
        throw error;
    } finally {
        conn.release();
    }
};

export const buscarFornecedoresSimplesPorCliente = async (cliente_id: number): Promise<RowDataPacket[]> => {
    const conn: PoolConnection = await pool.getConnection();
    try {
        const query = `
      SELECT id, razaoSocial
      FROM fornecedor_suprimentos
      WHERE cliente_id = ?
      ORDER BY razaoSocial ASC
    `;
        const [results] = await conn.query(query, [cliente_id]);
        return results as RowDataPacket[];
    } finally {
        conn.release();
    }
}; 

export const buscarFornecedorPorId = async (id: number): Promise<{ fornecedoresResult: RowDataPacket[] }> => {
  const queryBusca = `
    SELECT * FROM fornecedor_suprimentos WHERE id = ?
  `;

  const conn: PoolConnection = await pool.getConnection();
  try {
    const [fornecedoresResult] = await conn.query(queryBusca, [id]);
    return {
      fornecedoresResult: fornecedoresResult as RowDataPacket[]
    };
  } catch (error) {
    throw error;
  } finally {
    conn.release();
  }
};
