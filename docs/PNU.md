# PNU — Prontuário Unificado

**Prontuário eletrônico integrado para uma rede municipal de saúde**

> Documento principal do projeto. Substitui a versão anterior ("Prontuário Nacional Universal").
> Serve como norte do desenvolvimento e como base para o relatório acadêmico.
> **Atualizado para refletir o sistema efetivamente implementado** (Fases 1–7 concluídas). O modelo foi conscientemente expandido em relação ao MVP mínimo original — ver seção *Decisões registradas*.

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

Centralizar, dentro de uma rede municipal, o registro e o acesso a:

- consultas (sintomas, diagnóstico, evolução clínica);
- exames (categoria, resultados, laudos);
- medicações (medicamento, dosagem, frequência, duração);
- internações (setor, entrada, alta);
- observações médicas (recomendações, retornos);
- ficha demográfica completa do paciente;
- histórico clínico unificado de todas as unidades.

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
ORDER BY data_hora DESC;
```

Os atendimentos apontam para `unidade_id` diferentes — a "integração" do conceito é **consequência** de paciente compartilhado + atendimento compartilhado. A riqueza de campos clínicos por tipo de atendimento (seção 12) torna a demonstração mais convincente, mas não muda a tese: ela continua sendo a unificação. Saber explicar isto é o que separa "fiz um sisteminha" de "entendi o problema".

---

## 7. Escopo implementado

A tese central a provar: **o mesmo paciente, atendido em unidades diferentes da rede, tem um único histórico clínico visível por qualquer profissional autorizado.**

> Esta seção foi reescrita: descreve o que o sistema **faz hoje**, não o MVP mínimo planejado originalmente. A expansão foi consciente — ver seção 21.

### Dentro do escopo (implementado e testado)

| Item | Detalhe |
|---|---|
| Unidades | 6, de naturezas distintas (pública / filantrópica / privada) |
| Identificação | CNS (principal) + CPF (secundário) |
| Login | Autenticação de profissional (JWT + bcrypt) |
| Perfis | 2: **Médico** e **Recepção** |
| Busca | Por CNS, CPF ou nome (modo detectado pelo formato) |
| Ficha do paciente | Ficha demográfica **completa** (documentação, filiação, dados civis/físicos, contatos, endereço, informações médicas, dados da rede) + alertas clínicos em destaque |
| Tipos de atendimento | **Cinco**, cada um com campos clínicos próprios: Consulta, Exame, Medicação, Internação, Observação |
| Timeline unificada | Histórico de **todas** as unidades, ordem cronológica inversa, com filtro por tipo — o coração |
| Criar atendimento | Médico; formulário dinâmico por tipo; unidade vinculada ao token |
| Auditoria | Todo acesso a prontuário gravado em `log_acesso`; tela de log para o médico |

### Fora do escopo → Trabalhos Futuros (seção 20)

IA · assinatura digital · **upload de anexos** (laudos hoje são texto, não arquivo) · backup/redundância · mobile · perfis adicionais (enfermeiro, laboratório, administrador) · 2FA · acesso break-glass · integração real com a RNDS via FHIR · API pública documentada.

---

## 8. Fluxo principal

### 8.1 Login obrigatório

Ao acessar, o usuário cai direto na tela de login. Acesso totalmente restrito. Campos: e-mail profissional e senha.

### 8.2 Buscar paciente

Após o login, o profissional pesquisa o paciente por **CNS**, **CPF** ou **nome** (o modo é detectado pelo formato: 15 dígitos = CNS, 11 = CPF, resto = nome parcial).

> O CNS foi **mantido** como identificador principal. É a chave que a RNDS real utiliza, e o CPF não cobre todos os casos (recém-nascidos, alguns estrangeiros).

### 8.3 Abrir ficha do paciente

A ficha centraliza a identificação completa, os alertas clínicos em destaque e os dados da rede (unidade vinculada, nº de prontuário, primeiro/último atendimento, status).

### 8.4 Visualizar a timeline unificada

O sistema exibe o histórico clínico, **juntando atendimentos de todas as unidades da rede**, com renderização específica por tipo e filtro por categoria. Este é o entregável demonstrado na apresentação.

---

## 9. Controle de acesso

O sistema **não possui** cadastro público, criação livre de contas ou registro aberto. Somente o administrador da rede cria usuários e vincula profissionais a unidades.

> **Nota de arquitetura (registrar no relatório):** no protótipo, o médico tem acesso de leitura ao histórico de qualquer paciente da rede. Em produção isto deveria ser acesso *break-glass* (emergência com justificativa registrada), não acesso irrestrito. O `log_acesso` é o primeiro passo nessa direção; o modelo break-glass completo está em Trabalhos Futuros.

---

## 10. Estrutura da ficha do paciente (implementada)

A ficha demográfica completa está implementada. Campos da tabela `paciente`:

- **Documentação:** CNS, CPF, RG, certidão, RNE/RNI, nº de prontuário
- **Dados pessoais:** nome, nome social, gênero, sexo, data de nascimento, nacionalidade, naturalidade
- **Filiação:** nome da mãe, nome do pai, responsável legal
- **Dados civis e físicos:** estado civil, escolaridade, tipo sanguíneo, cor/raça
- **Contatos:** telefone principal, telefone secundário, e-mail, contato de emergência
- **Endereço:** CEP, rua, número, bairro, cidade, estado
- **Informações médicas:** alergias, doenças crônicas, deficiências, medicamentos contínuos, histórico cirúrgico, convênio
- **Dados da rede:** unidade vinculada, status do paciente, primeiro/último atendimento (derivados dos atendimentos)

Os campos **alergias** e **doenças crônicas** alimentam os alertas clínicos (seção 13).

---

## 11. Tipos de atendimento

O atendimento tem **cinco tipos** (campo `tipo`, com `CHECK` no banco), cada um com campos clínicos próprios além de descrição/diagnóstico/observações comuns:

| Tipo | Campos específicos |
|---|---|
| Consulta | sintomas, evolução médica |
| Exame | categoria (Laboratorial/Imagem/Outros), resultados, laudos |
| Medicação | medicamento prescrito, dosagem, frequência, duração |
| Internação | setor, data de entrada, data de alta |
| Observação | recomendações, previsão de retorno |

> Nota: estes são tipos de **atendimento clínico**, distintos dos tipos de **unidade** (UBS, UPA, Hospital, Ambulatório, Clínica) e da **natureza** da unidade (pública/filantrópica/privada). A versão anterior deste documento confundia os três — corrigido.

---

## 12. Histórico médico e timeline

Cada atendimento registra tipo, data/hora, descrição, diagnóstico, observações, profissional, unidade e os campos específicos do tipo (seção 11).

A **timeline unificada** organiza tudo em ordem cronológica **inversa** (mais recente primeiro), independentemente da unidade de origem, com filtro por tipo. A renderização é específica por tipo (consulta mostra sintomas/evolução; exame mostra laudo; medicação mostra posologia; etc.).

> Observação para a demonstração: como a ordenação é do mais recente ao mais antigo, conduza a fala como "o histórico mais recente do paciente, recuando no tempo" — ou inverta para ordem cronológica se a narrativa "passou pela UBS, depois UPA, depois Santa Casa" for mais clara na apresentação.

---

## 13. Alertas de risco

Alertas clínicos em destaque na ficha, derivados de `alergias` e `doencas_cronicas`. Severidade `critico` (vermelho) ou `atencao` (amarelo), por palavra-chave.

> **Ponto de atenção (defender na banca):** a lista de palavras-chave críticas hoje inclui condições comuns (diabetes, hipertensão). Quando quase todo alerta é "crítico", ocorre *alarm fatigue* — o usuário aprende a ignorar. Decisão a registrar: ou estreitar o conjunto crítico (alergia, anticoagulante, doença contagiosa) e deixar crônicas comuns como "atenção", ou manter e justificar o critério clínico adotado.

---

## 14. Status do paciente

O campo `status_paciente` existe na ficha (default `Ativo`). O vocabulário pretendido (Em atendimento, Em observação, Internado, Alta médica, Transferido, Encerrado, Óbito) é a evolução desejada; o protótipo usa o estado simplificado e a transição automática de status fica como melhoria futura.

---

## 15. Log de acessos

Todo acesso a um prontuário (ficha, timeline, criação de atendimento) é gravado em `log_acesso`: profissional, paciente, ação e horário. O médico visualiza o log de um paciente em tela própria.

Objetivo: conformidade com a LGPD demonstrada **na prática**. Bancas valorizam prova concreta em vez de citação genérica.

---

## 16. Perfis e permissões

| Perfil | Permissões |
|---|---|
| **Médico** | Buscar, ver ficha, ver timeline **completa** (campos clínicos), criar atendimento, ver log de acesso |
| **Recepção** | Buscar, ver ficha, ver timeline em **visão resumida** (sem diagnóstico/campos clínicos) |

A diferenciação médico/recepção é aplicada **no backend** (a query monta o objeto conforme o `role` do token) e refletida na UI. Perfis adicionais (enfermeiro, laboratório, administrador) → Trabalhos Futuros.

---

## 17. Modelo de dados (implementado)

```
unidade(id, nome, tipo, natureza, cidade)
  -- tipo: UBS | UPA | Hospital | Ambulatorio | Clinica
  -- natureza: publica | filantropica | privada

profissional(id, nome, email, senha_hash, crm, role, unidade_id → unidade)
  -- role: medico | recepcao

paciente(
  id, cns, cpf, rg, certidao, rne_rni,
  nome, nome_social, genero, data_nascimento, sexo,
  nacionalidade, naturalidade,
  nome_mae, nome_pai, responsavel_legal,
  estado_civil, escolaridade, tipo_sanguineo, cor_raca,
  telefone_principal, telefone_secundario, email, contato_emergencia,
  cep, rua, numero, bairro, cidade, estado,
  alergias, doencas_cronicas, deficiencias,
  medicamentos_continuos, historico_cirurgico, convenio_medico,
  numero_prontuario, unidade_vinculada_id → unidade, status_paciente
)

atendimento(
  id, paciente_id → paciente, profissional_id → profissional,
  unidade_id → unidade, tipo, data_hora, descricao, diagnostico, observacoes,
  -- Consulta:   sintomas, evolucao_medica
  -- Exame:      categoria_exame, resultados, laudos
  -- Medicação:  medicamentos_prescritos, dosagem, frequencia, duracao
  -- Internação: data_entrada, data_alta, setor
  -- Observação: recomendacoes, retornos
)

log_acesso(id, profissional_id → profissional, paciente_id → paciente, acao, timestamp)
```

`paciente` é compartilhado por toda a rede (não pertence a uma unidade; `unidade_vinculada_id` é apenas a unidade de origem). `atendimento` carrega `unidade_id` — é isso que torna a timeline "integrada" sem nenhuma lógica especial. Os campos clínicos específicos por tipo ficam todos na mesma tabela `atendimento` (modelo de tabela única com colunas opcionais por tipo).

---

## 18. Stack técnica (real)

> Reescrita para refletir o que está em uso, não o planejado.

- **Backend:** Node.js + Express, arquitetura controllers finos + camada `services/`, handler de erro centralizado.
- **Banco:** **PGlite** — PostgreSQL completo compilado em WebAssembly, embarcado no backend, persistido em arquivo local. Decisão pragmática: elimina provisionamento de banco; a aplicação "só roda". Schema e seed aplicados automaticamente na primeira execução.
- **Frontend:** HTML/CSS/JS (vanilla, single-page com troca de telas), **servido estaticamente pelo próprio Express** — frontend e API no mesmo serviço.
- **Auth:** JWT + bcrypt.
- **Deploy:** serviço único (ex.: Render), sem banco externo a provisionar.

> A stack original previa PostgreSQL gerenciado + React no Vercel. A migração para React e/ou banco gerenciado é uma evolução futura opcional, não um requisito do protótipo.

---

## 19. Roadmap (concluído)

| Fase | Entrega | Status |
|---|---|---|
| 1 | Schema + seed | ✅ |
| 2 | Auth (login, JWT, 2 perfis) | ✅ |
| 3 | Busca + ficha + alertas | ✅ |
| 4 | Timeline unificada (cruza unidades) | ✅ |
| 5 | Criar atendimento | ✅ |
| 6 | Auditoria (log por paciente) | ✅ |
| 7 | Interface | ✅ |

Todas as fases foram implementadas e validadas de ponta a ponta contra o banco real.

---

## 20. Trabalhos futuros

Seção esperada e valorizada em projeto acadêmico:

- Integração real com a **RNDS via FHIR**
- IA: resumo automático de prontuário, detecção de interações medicamentosas, apoio à triagem
- Assinatura digital com validade jurídica (CRM, data, hora, unidade)
- **Upload de anexos** (PDF/imagem de laudos e exames — hoje laudo é campo de texto)
- Acesso **break-glass** por necessidade clínica
- Autenticação em dois fatores e criptografia em repouso
- Backup automático, redundância e recuperação de desastres
- Versão mobile
- Perfis de enfermeiro, laboratório e administrador
- Transição automática de `status_paciente`
- API documentada para integração com sistemas terceiros

---

## 21. Decisões registradas

Registro do *porquê* de cada escolha — base para a fundamentação do relatório e para responder à banca sem improvisar.

- **Municipal, não nacional:** escopo factível em um semestre; resolve lacuna real; não compete com a RNDS.
- **CNS como identificador principal:** chave usada pela RNDS real; CPF não cobre todos os casos.
- **Expansão consciente do escopo (MVP mínimo → prontuário clínico completo):** após validar o backend mínimo (Fases 1–6), o modelo foi deliberadamente ampliado — ficha demográfica completa e cinco tipos de atendimento com campos clínicos específicos. **Justificativa [CONFIRMAR/AJUSTAR para o seu motivo real antes da entrega]:** demonstrar um prontuário clínico realista, não apenas a prova de conceito da integração, torna a apresentação mais convincente sem mudar a tese central. **Trade-off assumido:** mais telas, validação e superfície de teste — aceito porque o ganho de credibilidade compensa no contexto acadêmico. *(Esta decisão precisa estar registrada exatamente porque, sem ela, código e documento contariam histórias diferentes.)*
- **PGlite no lugar de PostgreSQL gerenciado:** elimina provisionamento de banco e torna o deploy/demonstração triviais; PostgreSQL real (WASM), então a tese e as queries são idênticas.
- **Frontend vanilla servido pelo Express:** menor atrito, deploy único; React é migração futura, não requisito.
- **2 perfis, não 5:** cada perfil extra é custo sem provar a tese.
- **Log de acesso desde cedo:** prova de LGPD aplicada a baixo custo.
- **IA / assinatura / upload de anexos fora:** features de superfície; não provam a tese de integração.
- **Acesso amplo do médico no protótipo, com ressalva registrada:** simplifica sem esconder o problema — o caminho correto (break-glass) está documentado.

---

## 22. Slogan

> "Um histórico. Qualquer unidade da rede."
