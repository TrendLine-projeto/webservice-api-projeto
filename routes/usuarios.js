const express = require('express');
const router = express.Router();
const mysql = require('../connect/mysql').pool;
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const login = require('../middleware/login')
require('dotenv').config();

router.get('/protected', login.verifyToken, (req, res) => {
    const email = req.body.email;
    res.json({ message: 'Rota protegida', email: email });
});

router.post('/cadastro', login.obrigatorio, (req, res) => {
    mysql.getConnection((error, conn) => {
        if (error) return res.status(500).send({ error });

        const { username, senha, email } = req.body;

        // Verifica se já existe usuário
        conn.query('SELECT * FROM usuarios WHERE username = ?', [username], (error, results) => {
            if (error) {
                conn.release();
                return res.status(500).send({ error });
            }

            if (results.length > 0) {
                conn.release();
                return res.status(409).send({ mensagem: 'Usuário já cadastrado' });
            }

            bcrypt.hash(senha, 10, (errBcrypt, hash) => {
                if (errBcrypt) {
                    conn.release();
                    return res.status(500).send({ error: errBcrypt });
                }

                const insertQuery = `
                    INSERT INTO usuarios (username, senha, email, idNivelUsuario) 
                    VALUES (?, ?, ?, 1)
                `;

                conn.query(insertQuery, [username, hash, email], (error, results) => {
                    conn.release();
                    if (error) return res.status(500).send({ error });

                    res.status(201).send({
                        mensagem: 'Usuário criado com sucesso!',
                        usuarioCriado: {
                            id: results.insertId,
                            username,
                            email
                        }
                    });
                });
            });
        });
    });
});

router.post('/login', (req, res) => {
    mysql.getConnection((error, conn) => {
        if (error) return res.status(500).send({ error });

        const { username, senha } = req.body;

        const query = `
            SELECT 
                u.id, u.username, u.email, u.senha, u.idCliente, u.idNivelUsuario,
                c.razaoSocial, c.nomeFantasia, c.cnpj
            FROM usuarios u
            INNER JOIN clientes c ON u.idCliente = c.id
            WHERE u.username = ?
        `;

        conn.query(query, [username], (error, results) => {
            if (error) {
                conn.release();
                return res.status(500).send({ error });
            }

            if (results.length < 1) {
                conn.release();
                return res.status(401).send({ mensagem: 'Usuário ou senha inválidos' });
            }

            const user = results[0];

            bcrypt.compare(senha, user.senha, (errBcrypt, result) => {
                if (errBcrypt) {
                    conn.release();
                    return res.status(401).send({ mensagem: 'Falha na autenticação' });
                }

                if (!result) {
                    conn.release();
                    return res.status(401).send({ mensagem: 'Usuário ou senha inválidos' });
                }

                // Buscar todas as filiais
                const filialQuery = `
                    SELECT id, nomeFilial, endereco, cidade, estado, cep, telefone
                    FROM filiais
                    WHERE idCliente = ?
                `;

                conn.query(filialQuery, [user.idCliente], (error, filiais) => {
                    if (error) {
                        conn.release();
                        return res.status(500).send({ error });
                    }

                    // Agora buscar os MENUS e SUBMENUS
                    const menuQuery = `
                        SELECT 
                            m.id, m.nome AS nomeMenu, m.icone, m.link,
                            sm.id AS idSubmenu, sm.nome AS nomeSubmenu, sm.link AS linkSubmenu
                        FROM menu m
                        LEFT JOIN submenu sm ON sm.idMenu = m.id
                        WHERE m.idNivelUsuario = ?
                    `;

                    conn.query(menuQuery, [user.idNivelUsuario], (error, menuResults) => {
                        conn.release();
                        if (error) return res.status(500).send({ error });

                        // Organizar os menus e submenus
                        const menusMap = new Map();

                        menuResults.forEach(row => {
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
                        }, process.env.SECRETE, { expiresIn: '1d' });

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
                                    filiais: filiais
                                },
                                menus: menus
                            }
                        });
                    });
                });
            });
        });
    });
});

router.get('/validartoken', login.obrigatorio, (req, res) => {
    mysql.getConnection((error, conn) => {
        if (error) return res.status(500).send({ error });

        const { id, idCliente, idNivelUsuario } = req.usuario;

        const queryUsuario = `
            SELECT 
                u.id, u.username, u.email,
                c.razaoSocial, c.nomeFantasia, c.cnpj
            FROM usuarios u
            INNER JOIN clientes c ON u.idCliente = c.id
            WHERE u.id = ?
        `;

        conn.query(queryUsuario, [id], (error, results) => {
            if (error) {
                conn.release();
                return res.status(500).send({ error });
            }

            if (results.length === 0) {
                conn.release();
                return res.status(404).send({ mensagem: 'Usuário não encontrado' });
            }

            const user = results[0];

            const filialQuery = `
                SELECT id, nomeFilial, endereco, cidade, estado, cep, telefone
                FROM filiais
                WHERE idCliente = ?
            `;

            conn.query(filialQuery, [idCliente], (error, filiais) => {
                if (error) {
                    conn.release();
                    return res.status(500).send({ error });
                }

                const menuQuery = `
                    SELECT 
                        m.id, m.nome AS nomeMenu, m.icone, m.link,
                        sm.id AS idSubmenu, sm.nome AS nomeSubmenu, sm.link AS linkSubmenu
                    FROM menu m
                    LEFT JOIN submenu sm ON sm.idMenu = m.id
                    WHERE m.idNivelUsuario = ?
                `;

                conn.query(menuQuery, [idNivelUsuario], (error, menuResults) => {
                    conn.release();
                    if (error) return res.status(500).send({ error });

                    const menusMap = new Map();

                    menuResults.forEach(row => {
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
                                filiais: filiais
                            },
                            menus: menus
                        }
                    });
                });
            });
        });
    });
});

module.exports = router;