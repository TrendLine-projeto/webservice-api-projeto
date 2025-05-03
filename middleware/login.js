const jwt = require('jsonwebtoken');
require('dotenv').config();

exports.obrigatorio = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).send({ mensagem: "Token não fornecido." });
    }

    const token = authHeader.split(" ")[1];
    const decode = jwt.verify(token, process.env.SECRETE);
    req.usuario = decode;

    next();
  } catch (error) {
    return res.status(401).send({ mensagem: "Token inválido ou expirado." });
  }
};

exports.verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: 'Token não fornecido' });
    }
    
    jwt.verify(token, process.env.SECRETE, (err, decodedToken) => {
      if (err) {
        return res.status(401).json({ message: 'Token inválido' });
      }
      req.user = decodedToken;
      next();
    });
};