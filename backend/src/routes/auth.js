// Fase 2 — Autenticação.
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { query } = require("../db");
const { authenticate } = require("../middleware/auth");
const { asyncH } = require("../utils/asyncH");

const router = express.Router();

// POST /api/auth/login  { email, senha }
router.post("/login", asyncH(async (req, res) => {
  const { email, senha } = req.body || {};
  if (!email || !senha) {
    return res.status(400).json({ erro: "Informe e-mail e senha." });
  }

  const rows = await query(
    `SELECT id, nome, email, senha_hash, role, unidade_id
       FROM profissional WHERE email = $1`,
    [email]
  );
  const prof = rows[0];

  // Mensagem genérica de propósito: não revela se o e-mail existe.
  const ok = prof && (await bcrypt.compare(senha, prof.senha_hash));
  if (!ok) {
    return res.status(401).json({ erro: "Credenciais inválidas." });
  }

  const payload = {
    id: prof.id,
    nome: prof.nome,
    role: prof.role,
    unidade_id: prof.unidade_id,
  };
  const token = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES || "8h",
  });

  res.json({ token, profissional: payload });
}));

// GET /api/auth/me  — confirma o token e devolve o usuário.
router.get("/me", authenticate, (req, res) => {
  res.json({ profissional: req.user });
});

module.exports = router;
