# PNU — Prontuário Unificado

Protótipo acadêmico de prontuário eletrônico integrado para uma
rede municipal de saúde (cenário: Franca/SP). Backend completo
(Fases 1–6). Interface (Fase 7) pendente.

> **Dados 100% sintéticos.** Nenhum dado real de paciente.
> Nomes de instituições = contexto local; projeto não afiliado
> a nenhuma delas. Ver `docs/PNU.md`.

## Estrutura

```
pmm/
  docs/
    PNU.md              documento do projeto (visão, escopo,
                        modelo de dados, decisões, roadmap)
  db/
    schema.sql          esquema PostgreSQL (5 tabelas + índices)
    seed.sql            dados sintéticos (atendimentos cruzando
                        unidades — prova a tese)
  backend/
    src/
      server.js         app Express, CORS, /health, graceful shutdown
      db.js             pool PostgreSQL + closePool()
      routes/           controllers slim (parseia req/res)
        auth.js
        pacientes.js
      services/         lógica de negócio
        paciente.service.js
        atendimento.service.js
      middleware/
        auth.js         authenticate + requireRole
        error.js        handler centralizado (stack só em dev)
      utils/
        asyncH.js       captura erro de handler async
        alertas.js      deriva alertas clínicos do paciente
    scripts/
      set-passwords.js  aplica senha bcrypt ao seed (dev only)
    .env.example        variáveis necessárias (copiar para .env)
    package.json
    README.md           detalhes do backend e endpoints
  .gitignore
```

## O que está pronto (Fases 1–6)

| Fase | Entrega | Status |
|------|---------|--------|
| 1 | Schema + seed | ✅ testado |
| 2 | Auth (login, JWT, 2 perfis) | ✅ testado |
| 3 | Busca de paciente + ficha + alertas | ✅ testado |
| 4 | Timeline unificada (cruza unidades) | ✅ testado |
| 5 | Criar atendimento | ✅ testado |
| 6 | Auditoria (log por paciente) | ✅ testado |
| 7 | Interface | ❌ Pendente |
