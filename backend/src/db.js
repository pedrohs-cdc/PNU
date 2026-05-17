// Conexão com banco de dados (PGlite - WASM PostgreSQL)
const { PGlite } = require('@electric-sql/pglite');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, '..', '.pnu-db');
const db = new PGlite(dbPath);
let initialized = false;

async function ensureInitialized() {
  if (initialized) return;
  try {
    await db.query('SELECT 1 FROM profissional LIMIT 1');
  } catch (err) {
    console.log('[db] Inicializando banco de dados com PGlite (rodando schema e seed)...');
    const schemaPath = path.join(__dirname, '../../db/schema.sql');
    const seedPath = path.join(__dirname, '../../db/seed.sql');
    
    if (fs.existsSync(schemaPath) && fs.existsSync(seedPath)) {
      const schemaSql = fs.readFileSync(schemaPath, 'utf8');
      const seedSql = fs.readFileSync(seedPath, 'utf8');
      await db.exec(schemaSql);
      await db.exec(seedSql);
      console.log('[db] Banco de dados inicializado com sucesso!');
    } else {
      console.warn('[db] Arquivos schema.sql e/ou seed.sql não encontrados.');
    }
  }
  initialized = true;
}

/**
 * Executa uma query parametrizada e retorna as linhas resultantes.
 */
async function query(text, params) {
  await ensureInitialized();
  const result = await db.query(text, params);
  return result.rows;
}

/**
 * Encerra o pool graciosamente.
 */
async function closePool() {
  await db.close();
}

module.exports = { pool: db, query, closePool };
