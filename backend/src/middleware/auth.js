// Middleware de autenticação e autorização.
const jwt = require("jsonwebtoken");

// Verifica o token Bearer e popula req.user.
function authenticate(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ erro: "Token ausente." });
  }

  try {
    // payload: { id, nome, role, unidade_id }
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (e) {
    return res.status(401).json({ erro: "Token inválido ou expirado." });
  }
}

// Restringe a rota a determinados perfis. Ex.: requireRole("medico").
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ erro: "Acesso negado para este perfil." });
    }
    next();
  };
}

module.exports = { authenticate, requireRole };
