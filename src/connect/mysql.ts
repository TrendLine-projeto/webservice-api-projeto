import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config(); 

const pool = mysql.createPool({
  host: process.env.MYSQLHOST,
  user: process.env.MYSQLUSER,
  password: process.env.MYSQLPASSWORD,
  database: process.env.MYSQLDATABASE,
  port: Number(process.env.MYSQLPORT),
});

export default pool;

(async () => {
  try {
    const conn = await pool.getConnection();
    const [rows] = await conn.query('SELECT NOW()');
    console.log('Conexão bem-sucedida com o banco de dados! Hora atual:', rows);
    conn.release();
  } catch (err) {
    console.error('Erro ao conectar no banco de dados:', err);
  }
})();
