// routes/usuarios.ts
import { Router, Request, Response, NextFunction } from 'express';
import pool from '../connect/mysql';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import * as login from '../middleware/login';
import dotenv from 'dotenv';

/**
 * @swagger
 * tags:
 *   name: Usuarios
 *   description: Cadastro, autenticacao e validacao de tokens.
 * components:
 *   schemas:
 *     UsuarioCadastroInput:
 *       type: object
 *       required:
 *         - username
 *         - senha
 *         - email
 *       properties:
 *         username:
 *           type: string
 *         senha:
 *           type: string
 *           format: password
 *         email:
 *           type: string
 *           format: email
 *     UsuarioLoginInput:
 *       type: object
 *       required:
 *         - username
 *         - senha
 *       properties:
 *         username:
 *           type: string
 *         senha:
 *           type: string
 *           format: password
 *     UsuarioAuthResponse:
 *       type: object
 *       properties:
 *         mensagem:
 *           type: string
 *         token:
 *           type: string
 *         usuario:
 *           type: object
 *           additionalProperties: true
 *     FavoritoInput:
 *       type: object
 *       required:
 *         - url
 *       properties:
 *         url:
 *           type: string
 *     Favorito:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         url:
 *           type: string
 *         idUsuario:
 *           type: integer
 */

dotenv.config();

const router = Router();

/**
 * @swagger
 * /usuarios/protected:
 *   get:
 *     summary: Testa se o token informado e valido.
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Token valido.
 *       401:
 *         description: Token ausente ou invalido.
 */
router.get('/protected', login.verifyToken, (req: Request, res: Response) => {
  const email = req.body.email;
  res.json({ message: 'Rota protegida', email });
});

/**
 * @swagger
 * /usuarios/cadastro:
 *   post:
 *     summary: Cria um novo usuario (administradores).
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UsuarioCadastroInput'
 *     responses:
 *       201:
 *         description: Usuario criado.
 *       409:
 *         description: Username ja existe.
 *       401:
 *         description: Token ausente ou invalido.
 */
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

/**
 * @swagger
 * /usuarios/login:
 *   post:
 *     summary: Autentica um usuario e retorna token JWT.
 *     tags: [Usuarios]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UsuarioLoginInput'
 *     responses:
 *       200:
 *         description: Login realizado.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UsuarioAuthResponse'
 *       401:
 *         description: Usuario ou senha invalidos.
 */
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

    const [favoritos] = await conn.query(`
      SELECT id, url, idUsuario
      FROM favoritos
      WHERE idUsuario = ?
    `, [user.id]);

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
    const favoritosList = (favoritos as any[]).map(f => ({
      id: f.id,
      url: f.url,
      idUsuario: f.idUsuario
    }));

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
        menus,
        favoritos: favoritosList
      }
    });
  } catch (error) {
    return res.status(500).send({ error });
  }
});

/**
 * @swagger
 * /usuarios/favoritos:
 *   post:
 *     summary: Cria um novo favorito para o usuario autenticado.
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/FavoritoInput'
 *     responses:
 *       201:
 *         description: Favorito criado.
 *       400:
 *         description: Dados invalidos.
 */
router.post('/favoritos', login.obrigatorio, async (req: Request & { usuario?: any }, res: Response) => {
  try {
    const { url } = req.body;
    const idUsuario = req.usuario?.id;

    if (!url) {
      return res.status(400).send({ mensagem: 'URL do favorito e obrigatoria.' });
    }

    const conn = await pool.getConnection();
    const [insertResult] = await conn.query(
      'INSERT INTO favoritos (url, idUsuario) VALUES (?, ?)',
      [url, idUsuario]
    );
    conn.release();

    res.status(201).send({
      mensagem: 'Favorito criado com sucesso!',
      favorito: {
        id: (insertResult as any).insertId,
        url,
        idUsuario
      }
    });
  } catch (error) {
    return res.status(500).send({ error });
  }
});

/**
 * @swagger
 * /usuarios/favoritos/{id}:
 *   delete:
 *     summary: Remove um favorito do usuario autenticado.
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Favorito removido.
 *       404:
 *         description: Favorito nao encontrado.
 */
router.delete('/favoritos/:id', login.obrigatorio, async (req: Request & { usuario?: any }, res: Response) => {
  try {
    const { id } = req.params;
    const idUsuario = req.usuario?.id;

    const conn = await pool.getConnection();
    const [deleteResult] = await conn.query(
      'DELETE FROM favoritos WHERE id = ? AND idUsuario = ?',
      [id, idUsuario]
    );
    conn.release();

    if ((deleteResult as any).affectedRows === 0) {
      return res.status(404).send({ mensagem: 'Favorito nao encontrado.' });
    }

    res.status(200).send({ mensagem: 'Favorito removido com sucesso.' });
  } catch (error) {
    return res.status(500).send({ error });
  }
});

/**
 * @swagger
 * /usuarios/validartoken:
 *   get:
 *     summary: Valida o token e retorna os dados do usuario logado.
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Token valido e dados retornados.
 *       401:
 *         description: Token ausente ou invalido.
 */
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
