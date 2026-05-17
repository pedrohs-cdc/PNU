// Resolve o "senha_hash placeholder" do seed.
// Aplica uma senha de desenvolvimento (bcrypt) a TODOS os
// profissionais, para permitir testar o login.
//
// Uso: npm run set-passwords
// SOMENTE ambiente de teste. Em produção, cada profissional
// definiria a própria senha via fluxo de cadastro.
require("dotenv").config();
const bcrypt = require("bcryptjs");
const { pool, query } = require("../src/db");

(async () => {
  const senha = process.env.DEV_PASSWORD || "pnu123";
  const hash = await bcrypt.hash(senha, 10);

  const rows = await query(
    `UPDATE profissional SET senha_hash = $1 RETURNING email, role`,
    [hash]
  );

  console.log(`Senha de desenvolvimento aplicada: "${senha}"\n`);
  console.log("Credenciais para teste:");
  for (const r of rows) {
    console.log(`  ${r.role.padEnd(9)} ${r.email}`);
  }
  const { closePool } = require("../src/db");
  await closePool();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
