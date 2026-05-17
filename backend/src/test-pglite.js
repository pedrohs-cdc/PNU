const { PGlite } = require('@electric-sql/pglite');
const path = require('path');
const fs = require('fs');

async function test() {
  const dbPath = path.join(__dirname, '..', '.pnu-db');
  console.log('dbPath:', dbPath);
  const db = new PGlite(dbPath);
  
  try {
    const res = await db.query('SELECT 1 as num');
    console.log('Test select:', res.rows);
    
    // Test if we can execute schema
    const schemaPath = path.join(__dirname, '../../db/schema.sql');
    const seedPath = path.join(__dirname, '../../db/seed.sql');
    console.log('Reading', schemaPath);
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    const seedSql = fs.readFileSync(seedPath, 'utf8');
    
    await db.exec(schemaSql);
    await db.exec(seedSql);
    console.log('Schema and seed executed!');
    
    const profs = await db.query('SELECT * FROM profissional');
    console.log('Profissionais:', profs.rows.length);
  } catch (err) {
    console.error('Error:', err);
  }
}
test();
