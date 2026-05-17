# PNU — Backend

Protótipo acadêmico. Fases 1–6 concluídas. Fase 7 (UI) pendente.

## Arquitetura

```
Request → Route (controller) → Service → db.query → PostgreSQL
                ↓
          middleware/error.js (handler centralizado)
```

As **rotas** (`routes/`) apenas parseiam `req` e retornam `res` — sem lógica de negócio.
Os **services** (`services/`) contêm toda a lógica: queries SQL, audit log, filtros por perfil.

## Pré-requisitos

- Node.js 18+
- PostgreSQL 14+ com banco criado e `../db/schema.sql` + `../db/seed.sql` aplicados

## Setup

```bash
npm install
cp .env.example .env      # ajuste DATABASE_URL e JWT_SECRET
npm run set-passwords     # aplica senha de teste (bcrypt) ao seed
npm start                 # sobe na porta do .env (padrão 3001)
```

> `set-passwords` resolve o `senha_hash` placeholder do seed,
> aplicando a senha de `DEV_PASSWORD` a todos os profissionais.
> Apenas ambiente de teste.

## Credenciais de teste (após `set-passwords`, senha `pnu123`)

| Perfil   | E-mail                     |
|----------|----------------------------|
| medico   | helena.martins@pnu.local   |
| medico   | rafael.antunes@pnu.local   |
| recepcao | patricia.lima@pnu.local    |

## Endpoints

| Método | Rota                              | Proteção       |
|--------|-----------------------------------|----------------|
| GET    | `/health`                         | pública        |
| POST   | `/api/auth/login`                 | pública        |
| GET    | `/api/auth/me`                    | token          |
| GET    | `/api/pacientes/busca?q=...`      | token          |
| GET    | `/api/pacientes/:id`              | token          |
| GET    | `/api/pacientes/:id/timeline`     | token          |
| POST   | `/api/pacientes/:id/atendimentos` | token + médico |
| GET    | `/api/pacientes/:id/log`          | token + médico |

`POST /api/auth/login` → `{ "email": "...", "senha": "..." }`
Retorna `{ token, profissional }`. Use o token em `Authorization: Bearer <token>`.

**Busca** (`/api/pacientes/busca?q=`): detecta automaticamente o modo —
15 dígitos = CNS, 11 = CPF, resto = nome (parcial, case-insensitive).

**Ficha** (`/api/pacientes/:id`): retorna dados do paciente +
`alertas` derivados de alergias/doenças crônicas (severidade `critico` ou `atencao`).
Toda visualização grava em `log_acesso` — prova de LGPD na prática.

**Timeline** (`/api/pacientes/:id/timeline`): histórico clínico unificado
de **todas as unidades** da rede, em ordem cronológica — o coração do projeto.
Médico vê `diagnostico` e `observacoes`; recepção vê apenas o resumo. Também auditada.

**Criar atendimento** (`POST /api/pacientes/:id/atendimentos`): só médico.
Corpo: `tipo` (Consulta|Exame|Internacao|Retorno|Procedimento|Outros),
`descricao` (obrigatórios), `diagnostico`, `observacoes`, `data_hora` (opcionais).
A **unidade é sempre a do profissional logado** — vem do token, nunca do cliente.

**Auditoria** (`/api/pacientes/:id/log`): só médico no MVP.
Lista quem acessou o prontuário, o quê, quando e de qual unidade.

## Estrutura

```
src/
  server.js                 app Express, CORS, /health, graceful shutdown
  db.js                     pool PostgreSQL + pool.on('error') + closePool()
  routes/
    auth.js                 login + /me
    pacientes.js            controller slim — delega para services/
  services/
    paciente.service.js     buscarPaciente, obterFicha, obterTimeline
    atendimento.service.js  criarAtendimento, obterLog, TIPOS
  middleware/
    auth.js                 authenticate + requireRole
    error.js                handler centralizado (stack só em dev)
  utils/
    asyncH.js               captura erro de handler async
    alertas.js              deriva alertas clínicos + PALAVRAS_CRITICAS
scripts/
  set-passwords.js          aplica senha bcrypt ao seed
```

## Scripts disponíveis

| Comando | O que faz |
|---------|-----------|
| `npm start` | Sobe o servidor em produção |
| `npm run dev` | Sobe com `--watch` (hot reload) |
| `npm run lint` | Verifica sintaxe de todos os `.js` |
| `npm run set-passwords` | Aplica senha de dev ao seed |

## Status do roadmap

- [x] Fase 1 — Schema + seed
- [x] Fase 2 — Auth (login, JWT, 2 roles)
- [x] Fase 3 — Busca de paciente + ficha (alertas + log_acesso)
- [x] Fase 4 — Timeline unificada (cruza unidades + perfil)
- [x] Fase 5 — Criar atendimento (médico, unidade do token)
- [x] Fase 6 — Auditoria (endpoint de log por paciente)
- [ ] Fase 7 — UI (login → busca → ficha → timeline)

> Backend completo. Todas as fases testadas de ponta a ponta
> contra PostgreSQL real. Próximo: a interface.
