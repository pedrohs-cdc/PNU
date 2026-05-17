# PNU — Prontuário Unificado

**Prontuário eletrônico integrado para uma rede municipal de saúde**

> Documento principal do projeto. Substitui a versão anterior ("Prontuário Nacional Universal").
> Serve como norte do desenvolvimento e como base para o relatório acadêmico.
> Escopo congelado para o MVP — mudanças exigem revisão consciente (ver seção *Decisões registradas*).

---

## 1. Visão geral

O PNU é um prontuário eletrônico que **unifica o histórico clínico de um paciente entre as diferentes unidades de uma mesma rede municipal de saúde**.

O problema concreto: um paciente é atendido numa UBS, depois numa UPA, depois na Santa Casa — e hoje cada instituição mantém seu próprio registro isolado. O profissional de uma unidade não enxerga o que aconteceu na outra. O PNU resolve isso dentro do escopo de **um município**.

Cenário do protótipo: município de **Franca/SP**, com instituições reais usadas apenas como contexto local (UBS, UPA, Santa Casa de Franca, Hospital do Coração, hospitais particulares e clínicas).

> **Disclaimer obrigatório (no relatório e no rodapé do sistema):** o PNU é um protótipo acadêmico. **Todos os pacientes e dados clínicos são sintéticos e fictícios** — nenhum dado real de paciente é utilizado. Os nomes das instituições aparecem apenas como contexto local; o projeto **não é afiliado nem endossado** por nenhuma delas.

---

## 2. Posicionamento (vs. RNDS)

A **RNDS (Rede Nacional de Dados em Saúde)**, do Ministério da Saúde, é a solução oficial de integração de dados clínicos em âmbito **nacional**, baseada no padrão HL7 FHIR.

O PNU **não substitui nem compete com a RNDS**. É um protótipo acadêmico que demonstra, em escala **municipal e reduzida**, os conceitos de identidade unificada de paciente e histórico clínico compartilhado entre unidades — uma lacuna que ainda existe na prática em muitos municípios brasileiros.

> Este parágrafo deve constar no relatório. Reconhecer a RNDS explicitamente blinda o projeto da pergunta de banca "isso já não existe?".

---

## 3. Objetivo do sistema

Centralizar, dentro de uma rede municipal, o acesso a:

- consultas;
- exames;
- medicações;
- diagnósticos;
- observações médicas;
- internações;
- histórico clínico completo.

Acessível apenas por profissionais autorizados da rede.

---

## 4. Conceito principal

O sistema conecta as unidades de saúde de **Franca/SP**, de naturezas distintas:

- **Pública (SUS / Prefeitura):** UBS, UPA
- **Filantrópica:** Santa Casa de Franca (atende SUS por contrato)
- **Privada:** Hospital do Coração, hospitais particulares, clínicas médicas

A integração ocorre porque o **paciente é único na rede** e seus atendimentos referenciam a unidade onde ocorreram.

> **A heterogeneidade é o ponto, não um detalhe.** Na realidade, essas esferas **não** compartilham prontuário: cada uma tem sistema próprio, não há obrigação legal de integração, e há barreiras de governança de dados e consentimento LGPD entre entidades distintas. O PNU **simula** essa integração inexistente — e expõe justamente a dificuldade real do problema. Isso deve ser declarado explicitamente no relatório (mesma lógica do posicionamento vs. RNDS). Cada unidade carrega o campo `natureza` (pública/filantrópica/privada) no modelo de dados para tornar essa distinção visível.

---

## 5. Nome oficial

# PNU
## Prontuário Unificado

Conceito: prontuário integrado, identidade única de paciente, histórico clínico compartilhado, saúde municipal conectada.

---

## 6. Tese central

A integração **não é uma feature difícil — ela emerge do modelo de dados.** Se a identidade do paciente é única na rede e os atendimentos referenciam paciente e unidade, a timeline unificada é literalmente:

```sql
SELECT * FROM atendimento
WHERE paciente_id = ?
ORDER BY data_hora;
```

Os atendimentos apontam para `unidade_id` diferentes — a "integração" do conceito é **consequência** de paciente compartilhado + atendimento compartilhado. Saber explicar isto é o que separa "fiz um sisteminha" de "entendi o problema".

---

## 7. Escopo do MVP

A tese única a provar: **o mesmo paciente, atendido em unidades diferentes da rede, tem um único histórico clínico visível por qualquer profissional autorizado.**

### Dentro do MVP

| Item | Detalhe |
|---|---|
| Unidades | Mínimo 3 (ex.: UBS Centro, UPA Norte, Hospital Municipal) |
| Identificação | CNS (principal) + CPF (secundário) |
| Login | Autenticação de profissional (JWT + senha com hash) |
| Perfis | 2: **Médico** e **Recepção** |
| Busca | Por CNS, CPF ou nome |
| Ficha do paciente | Dados pessoais + alertas clínicos em destaque |
| Timeline unificada | Histórico cronológico de **todas** as unidades — o coração |
| Criar atendimento | Vinculado à unidade do profissional logado |
| Log de acesso | Quem viu qual prontuário e quando |

### Fora do MVP → Trabalhos Futuros (seção 17)

IA · assinatura digital · módulo de anexos · backup/redundância · mobile · módulo de exames/laboratório · perfis adicionais · busca por múltiplos campos · API pública · 2FA · integração real com a RNDS via FHIR.

---

## 8. Fluxo principal

### 8.1 Login obrigatório

Ao acessar, o usuário cai direto na tela de login. Acesso totalmente restrito. Campos: e-mail profissional e senha.

### 8.2 Buscar paciente

Após o login, o profissional pesquisa o paciente por **CNS**, **CPF** ou **nome completo**.

> O CNS foi **mantido** como identificador principal. É a chave que a RNDS real utiliza, e o CPF não cobre todos os casos (recém-nascidos, alguns estrangeiros). Isto reverte conscientemente a decisão equivocada do documento original.

### 8.3 Abrir ficha do paciente

A ficha centraliza dados pessoais e alertas clínicos.

### 8.4 Visualizar a timeline unificada

O sistema exibe o histórico clínico em ordem cronológica, **juntando atendimentos de todas as unidades da rede**. Este é o entregável demonstrado na apresentação.

---

## 9. Controle de acesso

O sistema **não possui** cadastro público, criação livre de contas ou registro aberto.

Somente o administrador da rede cria usuários, libera acessos e vincula profissionais a unidades.

Objetivo: segurança, rastreabilidade, proteção de dados e conformidade com a LGPD.

> **Nota de arquitetura (registrar no relatório):** no MVP, o médico tem acesso de leitura ao histórico de qualquer paciente da rede. Em um sistema de produção, isto deveria ser acesso *break-glass* (acesso de emergência com justificativa registrada) por necessidade clínica, não acesso irrestrito. O `LogAcesso` é o primeiro passo nessa direção. O modelo break-glass completo está em Trabalhos Futuros.

---

## 10. Estrutura da ficha do paciente

Subconjunto **em negrito** = obrigatório no MVP. Demais campos = desejáveis/futuros.

- **Dados pessoais:** **nome completo**, nome social, gênero, **sexo**, **data de nascimento**, idade, nacionalidade, naturalidade
- Filiação: nome da mãe, nome do pai, responsável legal
- **Documentação:** **CNS**, **CPF**, RG, certidão, RNE/RNI
- Dados civis: estado civil, escolaridade
- Dados físicos: tipo sanguíneo, cor/raça
- Contatos: telefone principal, telefone secundário, e-mail, contato de emergência
- Endereço: CEP, rua, número, bairro, cidade, estado
- **Informações médicas:** **alergias**, **doenças crônicas**, deficiências, uso contínuo de medicamentos, histórico cirúrgico, convênio
- Informações da rede: número do prontuário, unidade de origem, primeiro atendimento, último atendimento, **status do paciente**

---

## 11. Categorias de atendimento

Categorias universais em vez de nomes específicos de unidades: **UBS**, **Ambulatório**, **UPA**, **Hospital**, **Internação**, **Exame**, **Outros**.

Objetivo: padronização, organização e facilidade de integração na rede.

---

## 12. Histórico médico e timeline

Cada atendimento registra: tipo, data/hora, descrição, diagnóstico, observações, profissional e unidade.

A **timeline unificada** organiza tudo em ordem cronológica, independentemente da unidade de origem. Exemplo:

- 12/05/2026 — Consulta · UBS Centro
- 14/05/2026 — Exame laboratorial · Hospital Municipal
- 20/05/2026 — Internação · Hospital Municipal
- 25/05/2026 — Alta médica · Hospital Municipal

Objetivo: visualização rápida, melhor acompanhamento, redução de erros, histórico centralizado.

---

## 13. Alertas de risco (MVP)

Alertas clínicos críticos visíveis em destaque na ficha: alergias graves, diabetes, hipertensão, risco cardíaco, uso de anticoagulantes, doenças contagiosas, restrições médicas.

Mantido no MVP por ser barato de implementar e de alto valor demonstrável (deriva dos campos `alergias` e `doencas_cronicas`).

---

## 14. Status do paciente

Indicadores: Em atendimento · Em observação · Internado · Alta médica · Transferido · Encerrado · Óbito.

Objetivo: acompanhamento em tempo real e identificação rápida do estado atual.

---

## 15. Log de acessos (MVP)

O sistema registra todo acesso a um prontuário: profissional, paciente, ação e horário.

Objetivo: conformidade com a LGPD demonstrada **na prática**, auditoria e prevenção de acessos indevidos. Bancas valorizam muito uma prova concreta de LGPD em vez de citação genérica.

---

## 16. Perfis e permissões

| Perfil | Permissões |
|---|---|
| **Médico** | Buscar paciente, ver ficha e timeline completa, criar atendimento |
| **Recepção** | Buscar paciente, ver ficha básica, cadastrar/atualizar paciente |

Perfis adicionais (enfermeiro, laboratório, administrador completo) → Trabalhos Futuros. Cada perfil extra é tela, regra e teste a mais sem provar a tese.

---

## 17. Modelo de dados

```
Unidade(id, nome, tipo, natureza, cidade)
       -- tipo: UBS | UPA | Hospital | Ambulatorio | Clinica
       -- natureza: publica | filantropica | privada

Profissional(id, nome, email, senha_hash, crm, role,
             unidade_id → Unidade)

Paciente(id, cns, cpf, nome, nome_social, data_nascimento,
         sexo, alergias, doencas_cronicas)

Atendimento(id, paciente_id → Paciente,
            profissional_id → Profissional,
            unidade_id → Unidade,
            tipo, data_hora, descricao, diagnostico, observacoes)

LogAcesso(id, profissional_id → Profissional,
          paciente_id → Paciente, acao, timestamp)
```

`Paciente` é compartilhado por toda a rede (não pertence a uma unidade). `Atendimento` carrega `unidade_id` — é isso que torna a timeline "integrada" sem nenhuma lógica especial.

---

## 18. Stack técnica

Mesma topologia já dominada no Prompt Quest — custo de aprender infraestrutura ≈ zero.

- **Frontend:** React → deploy no Vercel
- **Backend:** Node.js + Express → deploy no Render
- **Banco:** PostgreSQL (Render Postgres grátis ou Supabase)
- **Auth:** JWT + bcrypt

---

## 19. Roadmap de execução

Cada fase entrega algo que já roda sozinho.

1. **Schema + seed** — 3 unidades, ~5 pacientes, atendimentos já cruzando unidades
2. **Auth** — login, JWT, 2 roles
3. **Busca + ficha** — buscar paciente, exibir dados + alertas em destaque
4. **Timeline unificada** — o coração; é isto que se demonstra na apresentação
5. **Criar atendimento** — vinculado à unidade do profissional logado
6. **Log de acesso** — registro + tela de visualização
7. **Polir UI** — visual premium por último

> A interface premium é o passo **7**, não o 1. Integração funcionando feia ganha de bonita vazia toda vez. O documento original cometia exatamente esse erro ao listar "interface premium" como primeiro passo.

Estilo visual desejado (fase 7): moderno, clean, institucional, healthtech. Paleta: azul hospitalar, verde saúde, branco, cinza, dark mode opcional.

---

## 20. Trabalhos futuros

Consolidação de tudo que saiu do MVP — seção esperada e valorizada em projeto acadêmico:

- Integração real com a **RNDS via FHIR**
- IA: resumo automático de prontuário, detecção de interações medicamentosas, apoio à triagem
- Assinatura digital com validade jurídica (CRM, data, hora, unidade)
- Módulo de anexos (PDF, imagens, exames de imagem)
- Acesso **break-glass** por necessidade clínica
- Autenticação em dois fatores e criptografia em repouso
- Backup automático, redundância e recuperação de desastres
- Versão mobile
- Módulo dedicado de exames/laboratório com upload de laudos
- Perfis de enfermeiro, laboratório e administrador
- API documentada para integração com sistemas terceiros

---

## 21. Decisões registradas

Registro do *porquê* de cada escolha — base para a fundamentação do relatório e para responder à banca sem improvisar.

- **Municipal, não nacional:** escopo factível em um semestre; resolve lacuna real; não compete com a RNDS.
- **CNS como identificador principal:** chave usada pela RNDS real; CPF não cobre todos os casos. Reverte erro do documento original.
- **2 perfis, não 5:** cada perfil extra é custo sem provar a tese.
- **Log de acesso no MVP:** prova de LGPD aplicada a baixo custo.
- **IA / assinatura / anexos fora:** features de superfície; não provam a tese de integração.
- **UI por último:** evita a armadilha do documento original.
- **Acesso amplo do médico no MVP, com ressalva registrada:** simplifica o protótipo sem esconder o problema — o caminho correto (break-glass) está documentado.

---

## 22. Slogan

> "Um histórico. Qualquer unidade da rede."
