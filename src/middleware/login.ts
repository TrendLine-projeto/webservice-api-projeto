// middleware/login.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

interface JwtPayload {
  id: number;
  username: string;
  email: string;
  idCliente: number;
  idNivelUsuario: number;
  [key: string]: any;
}

export const obrigatorio = (req: Request & { usuario?: JwtPayload }, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).send({ mensagem: 'Token não fornecido.' });
    }

    const token = authHeader.split(' ')[1];
    const decode = jwt.verify(token, process.env.SECRETE || '') as JwtPayload;
    req.usuario = decode;

    next();
  } catch (error) {
    return res.status(401).send({ mensagem: 'Token inválido ou expirado.' });
  }
};

export const verifyToken = (req: Request & { user?: JwtPayload }, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Token não fornecido' });
  }

  jwt.verify(token, process.env.SECRETE || '', (err, decodedToken) => {
    if (err) {
      return res.status(401).json({ message: 'Token inválido' });
    }
    req.user = decodedToken as JwtPayload;
    next();
  });
};
