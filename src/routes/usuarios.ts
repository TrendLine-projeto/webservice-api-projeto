// routes/usuarios.ts
import { Router, Request, Response, NextFunction } from 'express';
import pool from '../connect/mysql';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import * as login from '../middleware/login';
import dotenv from 'dotenv';

dotenv.config();

const router = Router();

router.get('/protected', login.verifyToken, (req: Request, res: Response) => {
  const email = req.body.email;
  res.json({ message: 'Rota protegida', email });
});

router.post('/cadastro', login.obrigatorio, async (req: Request, res: Response) => {
  try {
    const conn = await pool.getConnection();
    const { username, senha, email } = req.body;

    const [results] = await conn.query('SELECT * FROM usuarios WHERE username = ?', [username]);
    if ((results as any[]).length > 0) {
      conn.release();
      return res.status(409).send({ mensagem: 'Usuário já cadastrado' });
    }

    const hash = await bcrypt.hash(senha, 10);
    const insertQuery = `
      INSERT INTO usuarios (username, senha, email, idNivelUsuario) 
      VALUES (?, ?, ?, 1)
    `;
    const [insertResult] = await conn.query(insertQuery, [username, hash, email]);
    conn.release();

    res.status(201).send({
      mensagem: 'Usuário criado com sucesso!',
      usuarioCriado: {
        id: (insertResult as any).insertId,
        username,
        email
      }
    });
  } catch (error) {
    return res.status(500).send({ error });
  }
});

router.post('/login', async (req: Request, res: Response) => {
  try {
    const conn = await pool.getConnection();
    const { username, senha } = req.body;

    const [results] = await conn.query(`
      SELECT 
        u.id, u.username, u.email, u.senha, u.idCliente, u.idNivelUsuario,
        c.razaoSocial, c.nomeFantasia, c.cnpj
      FROM usuarios u
      INNER JOIN clientes c ON u.idCliente = c.id
      WHERE u.username = ?
    `, [username]);

    if ((results as any[]).length < 1) {
      conn.release();
      return res.status(401).send({ mensagem: 'Usuário ou senha inválidos' });
    }

    const user = (results as any[])[0];
    const senhaConfere = await bcrypt.compare(senha, user.senha);
    if (!senhaConfere) {
      conn.release();
      return res.status(401).send({ mensagem: 'Usuário ou senha inválidos' });
    }

    const [filiais] = await conn.query(`
      SELECT id, nomeFilial, endereco, cidade, estado, cep, telefone
      FROM filiais WHERE idCliente = ?
    `, [user.idCliente]);

    const [menuResults] = await conn.query(`
      SELECT 
        m.id, m.nome AS nomeMenu, m.icone, m.link,
        sm.id AS idSubmenu, sm.nome AS nomeSubmenu, sm.link AS linkSubmenu
      FROM menu m
      LEFT JOIN submenu sm ON sm.idMenu = m.id
      WHERE m.idNivelUsuario = ?
    `, [user.idNivelUsuario]);

    conn.release();

    const menusMap = new Map<number, any>();
    (menuResults as any[]).forEach(row => {
      if (!menusMap.has(row.id)) {
        menusMap.set(row.id, {
          id: row.id,
          nome: row.nomeMenu,
          icone: row.icone,
          link: row.link,
          submenus: []
        });
      }
      if (row.idSubmenu) {
        menusMap.get(row.id).submenus.push({
          id: row.idSubmenu,
          nome: row.nomeSubmenu,
          link: row.linkSubmenu
        });
      }
    });

    const menus = Array.from(menusMap.values());
    const token = jwt.sign({
      id: user.id,
      username: user.username,
      email: user.email,
      idCliente: user.idCliente,
      idNivelUsuario: user.idNivelUsuario
    }, process.env.SECRETE || '', { expiresIn: '1d' });

    res.status(200).send({
      mensagem: 'Autenticado com sucesso!',
      token,
      usuario: {
        id: user.id,
        username: user.username,
        email: user.email,
        cliente: {
          id: user.idCliente,
          razaoSocial: user.razaoSocial,
          nomeFantasia: user.nomeFantasia,
          cnpj: user.cnpj,
          filiais
        },
        menus
      }
    });
  } catch (error) {
    return res.status(500).send({ error });
  }
});

router.get('/validartoken', login.obrigatorio, async (req: any, res: Response) => {
  try {
    const conn = await pool.getConnection();
    const { id, idCliente, idNivelUsuario } = req.usuario;

    const [results] = await conn.query(`
      SELECT 
        u.id, u.username, u.email,
        c.razaoSocial, c.nomeFantasia, c.cnpj
      FROM usuarios u
      INNER JOIN clientes c ON u.idCliente = c.id
      WHERE u.id = ?
    `, [id]);

    if ((results as any[]).length === 0) {
      conn.release();
      return res.status(404).send({ mensagem: 'Usuário não encontrado' });
    }

    const user = (results as any[])[0];
    const [filiais] = await conn.query(`
      SELECT id, nomeFilial, endereco, cidade, estado, cep, telefone
      FROM filiais WHERE idCliente = ?
    `, [idCliente]);

    const [menuResults] = await conn.query(`
      SELECT 
        m.id, m.nome AS nomeMenu, m.icone, m.link,
        sm.id AS idSubmenu, sm.nome AS nomeSubmenu, sm.link AS linkSubmenu
      FROM menu m
      LEFT JOIN submenu sm ON sm.idMenu = m.id
      WHERE m.idNivelUsuario = ?
    `, [idNivelUsuario]);

    conn.release();

    const menusMap = new Map<number, any>();
    (menuResults as any[]).forEach(row => {
      if (!menusMap.has(row.id)) {
        menusMap.set(row.id, {
          id: row.id,
          nome: row.nomeMenu,
          icone: row.icone,
          link: row.link,
          submenus: []
        });
      }
      if (row.idSubmenu) {
        menusMap.get(row.id).submenus.push({
          id: row.idSubmenu,
          nome: row.nomeSubmenu,
          link: row.linkSubmenu
        });
      }
    });

    const menus = Array.from(menusMap.values());
    res.status(200).send({
      usuario: {
        id: user.id,
        username: user.username,
        email: user.email,
        cliente: {
          id: idCliente,
          razaoSocial: user.razaoSocial,
          nomeFantasia: user.nomeFantasia,
          cnpj: user.cnpj,
          filiais
        },
        menus
      }
    });
  } catch (error) {
    return res.status(500).send({ error });
  }
});

export default router;