const jwt = require('jsonwebtoken');

function auth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ mensagem: 'Faça login para continuar.' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret');
    next();
  } catch {
    return res.status(401).json({ mensagem: 'Sessão inválida ou expirada.' });
  }
}

function roles(...allowed) {
  return (req, res, next) => allowed.includes(req.user?.role)
    ? next()
    : res.status(403).json({ mensagem: 'Você não tem permissão para acessar este recurso.' });
}
module.exports = { auth, roles };
