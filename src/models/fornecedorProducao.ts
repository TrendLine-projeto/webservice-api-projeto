import pool from '../connect/mysql';
import { PoolConnection, RowDataPacket, ResultSetHeader } from 'mysql2/promise';
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

export const buscarFornecedorPorId = async (id: number): Promise<{ fornecedoresResult: RowDataPacket[] }> => {
  const queryBusca = `
    SELECT * FROM fornecedor_producao WHERE id = ?
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

export const verificarClientePorId = async (cliente_id: number): Promise<boolean> => {
    const conn: PoolConnection = await pool.getConnection();
    try {
        const [rows] = await conn.query('SELECT id FROM clientes WHERE id = ?', [cliente_id]);
        return (rows as RowDataPacket[]).length > 0;
    } finally {
        conn.release();
    }
};

export const inserirFornecedor = async (fornecedor: any): Promise<ResultSetHeader> => {
  const conn: PoolConnection = await pool.getConnection();
  try {
    const sql = `
      INSERT INTO fornecedor_producao (
        razaoSocial,
        nomeFantasia,
        cnpj,
        inscricaoEstadual,
        email,
        telefone,
        celular,
        responsavel,
        site,
        tipoFornecedor,
        categoria,
        endereco,
        bairro,
        cidade,
        estado,
        cep,
        pais,
        observacoes,
        ativo,
        cliente_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
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
      fornecedor.ativo ? 1 : 0,
      fornecedor.cliente_id
    ];

    const [result] = await conn.query<ResultSetHeader>(sql, values);
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

export const deletarFornecedor = async (
  id: number
): Promise<{ sucesso: boolean; linhasAfetadas: number }> => {
  try {
    const query = `DELETE FROM fornecedor_producao WHERE id = ?`;
    const [result] = await pool.execute<ResultSetHeader>(query, [id]);

    return {
      sucesso: result.affectedRows > 0,
      linhasAfetadas: result.affectedRows
    };
  } catch (error) {
    console.error('Erro no Model deletarFornecedor:', error);
    return {
      sucesso: false,
      linhasAfetadas: 0
    };
  }
};

export const buscarFornecedoresPorIds = async (ids: number[]) => {
  if (!ids.length) return {};

  const placeholders = ids.map(() => '?').join(',');
  const query = `
    SELECT * FROM fornecedor_producao
    WHERE id IN (${placeholders})
  `;

  const conn: PoolConnection = await pool.getConnection();
  try {
    const [result] = await conn.query<RowDataPacket[]>(query, ids);
    const fornecedores = result;

    const porId: Record<number, any> = {};
    for (const f of fornecedores) {
      porId[f.id] = f;
    }

    return porId;
  } finally {
    conn.release();
  }
};