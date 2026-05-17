-- =============================================================
-- PNU — Prontuário Unificado
-- Fase 1: Seed (PostgreSQL)
--
-- ATENÇÃO: TODOS os pacientes e dados clínicos abaixo são
-- 100% SINTÉTICOS e FICTÍCIOS. CNS/CPF NÃO são números reais.
-- Nomes de instituições = contexto local (Franca/SP); o
-- projeto não é afiliado a nenhuma delas.
--
-- O ponto-chave: alguns pacientes têm atendimentos em
-- unidades DIFERENTES. É isso que a timeline unificada
-- demonstra — a tese central do projeto.
-- =============================================================

-- ---------- UNIDADES (heterogeneidade real de Franca) --------
INSERT INTO unidade (nome, tipo, natureza, cidade) VALUES
  ('UBS Centro',                 'UBS',      'publica',      'Franca'),  -- 1
  ('UBS Zona Norte',             'UBS',      'publica',      'Franca'),  -- 2
  ('UPA Franca',                 'UPA',      'publica',      'Franca'),  -- 3
  ('Santa Casa de Franca',       'Hospital', 'filantropica', 'Franca'),  -- 4
  ('Hospital do Coração',        'Hospital', 'privada',      'Franca'),  -- 5
  ('Clínica Médica Integrada',   'Clinica',  'privada',      'Franca');  -- 6

-- ---------- PROFISSIONAIS ------------------------------------
-- senha_hash abaixo é um PLACEHOLDER. Na Fase 2 (auth),
-- gerar com bcrypt. Não usar esses valores em produção.
INSERT INTO profissional (nome, email, senha_hash, crm, role, unidade_id) VALUES
  ('Dra. Helena Martins',  'helena.martins@pnu.local',  '$2b$10$placeholderhashplaceholderhashpla', 'CRM-SP 123456', 'medico',   1),
  ('Dr. Rafael Antunes',   'rafael.antunes@pnu.local',  '$2b$10$placeholderhashplaceholderhashpla', 'CRM-SP 234567', 'medico',   3),
  ('Dr. Bruno Carvalho',   'bruno.carvalho@pnu.local',  '$2b$10$placeholderhashplaceholderhashpla', 'CRM-SP 345678', 'medico',   4),
  ('Dra. Camila Souza',    'camila.souza@pnu.local',    '$2b$10$placeholderhashplaceholderhashpla', 'CRM-SP 456789', 'medico',   5),
  ('Patrícia Lima',        'patricia.lima@pnu.local',   '$2b$10$placeholderhashplaceholderhashpla', NULL,            'recepcao', 1),
  ('Sandro Oliveira',      'sandro.oliveira@pnu.local', '$2b$10$placeholderhashplaceholderhashpla', NULL,            'recepcao', 4);

-- ---------- PACIENTES (sintéticos completos) -------------------
INSERT INTO paciente
  (cns, cpf, rg, certidao, rne_rni, 
   nome, nome_social, genero, data_nascimento, sexo, nacionalidade, naturalidade, 
   nome_mae, nome_pai, responsavel_legal, 
   estado_civil, escolaridade, tipo_sanguineo, cor_raca, 
   telefone_principal, telefone_secundario, email, contato_emergencia, 
   cep, rua, numero, bairro, cidade, estado, 
   alergias, doencas_cronicas, deficiencias, medicamentos_continuos, historico_cirurgico, convenio_medico, 
   numero_prontuario, unidade_vinculada_id, status_paciente) 
VALUES
  (
   '700000000000001', '00000000001', '12.345.678-9', NULL, NULL,
   'João Pereira da Silva', NULL, 'Cisgênero', '1968-03-12', 'M', 'Brasileira', 'Franca',
   'Maria Tereza da Silva', 'José Pereira', NULL,
   'Casado', 'Ensino Médio Completo', 'O+', 'Parda',
   '(16) 99999-1111', '(16) 3333-1111', 'joao.pereira@email.com', 'Maria (Esposa) - (16) 99999-1112',
   '14400-000', 'Rua das Flores', '123', 'Vila Nova', 'Franca', 'SP',
   'Penicilina', 'Hipertensão; Diabetes tipo 2', 'Nenhuma', 'Losartana 50mg, Metformina 850mg', 'Apendicectomia (1995)', 'SUS',
   'PR-001', 1, 'Ativo'
  ),
  (
   '700000000000002', '00000000002', '23.456.789-0', NULL, NULL,
   'Maria Aparecida Gomes', NULL, 'Cisgênero', '1955-11-30', 'F', 'Brasileira', 'Ribeirão Preto',
   'Joana Gomes', 'Antônio Gomes', NULL,
   'Viúva', 'Ensino Fundamental', 'A+', 'Branca',
   '(16) 98888-2222', NULL, NULL, 'Carlos (Filho) - (16) 98888-2223',
   '14401-111', 'Avenida Brasil', '45', 'Jardim Alvorada', 'Franca', 'SP',
   'Dipirona', 'Hipertensão', 'Auditiva (leve)', 'Enalapril 20mg', 'Catarata OD (2020)', 'Unimed Franca',
   'PR-002', 2, 'Ativo'
  ),
  (
   '700000000000003', '00000000003', '34.567.890-1', NULL, NULL,
   'Carlos Eduardo Ramos', 'Carol Ramos', 'Transgênero', '1990-07-08', 'M', 'Brasileira', 'São Paulo',
   'Helena Ramos', 'Ricardo Ramos', NULL,
   'Solteiro', 'Ensino Superior Completo', 'AB-', 'Preta',
   '(11) 97777-3333', NULL, 'carol.ramos@email.com', 'Helena (Mãe) - (11) 97777-3334',
   '14402-222', 'Rua São Paulo', '789', 'Centro', 'Franca', 'SP',
   NULL, NULL, NULL, 'Terapia hormonal', 'Nenhuma', 'São Francisco Saúde',
   'PR-003', 1, 'Ativo'
  ),
  (
   '700000000000004', '00000000004', '45.678.901-2', NULL, NULL,
   'Ana Beatriz Fernandes', NULL, 'Cisgênero', '2001-01-22', 'F', 'Brasileira', 'Franca',
   'Luciana Fernandes', 'Paulo Fernandes', NULL,
   'Solteira', 'Ensino Superior Incompleto', 'B+', 'Branca',
   '(16) 96666-4444', NULL, 'ana.beatriz@email.com', 'Luciana (Mãe) - (16) 96666-4445',
   '14403-333', 'Rua Amazonas', '1020', 'Jardim Consolação', 'Franca', 'SP',
   'Látex', 'Asma', NULL, 'Salbutamol (SN)', 'Nenhuma', 'SUS',
   'PR-004', 1, 'Ativo'
  ),
  (
   '700000000000005', '00000000005', '56.789.012-3', NULL, NULL,
   'Roberto Nunes Teixeira', NULL, 'Cisgênero', '1979-09-15', 'M', 'Brasileira', 'Franca',
   'Teresa Nunes Teixeira', 'Mário Teixeira', NULL,
   'Divorciado', 'Ensino Médio Incompleto', 'O-', 'Parda',
   '(16) 95555-5555', NULL, 'roberto.teixeira@email.com', 'Silvia (Irmã) - (16) 95555-5556',
   '14404-444', 'Rua Paraná', '55', 'Vila Industrial', 'Franca', 'SP',
   NULL, 'Uso de anticoagulante (varfarina)', 'Física (cadeirante)', 'Varfarina 5mg', 'Cirurgia cardíaca (troca valvar)', 'SUS',
   'PR-005', 2, 'Ativo'
  );

-- ---------- ATENDIMENTOS -------------------------------------
-- João (id 1): Consulta, Exame, Medicação e Internação!
INSERT INTO atendimento
  (paciente_id, profissional_id, unidade_id, tipo, data_hora, descricao, diagnostico, observacoes, 
   sintomas, evolucao_medica, 
   categoria_exame, resultados, laudos, 
   medicamentos_prescritos, dosagem, frequencia, duracao, 
   data_entrada, data_alta, setor, 
   recomendacoes, retornos) 
VALUES
  (1, 1, 1, 'Consulta', '2026-02-10 09:15', 'Consulta de rotina com queixa de cefaleia leve', 'Hipertensão Essencial', 'Paciente apresenta boa adesão terapêutica.',
   'Cefaleia esporádica e leve tontura', 'PA estável (130x80). Ausculta cardíaca normal.',
   NULL, NULL, NULL,
   NULL, NULL, NULL, NULL,
   NULL, NULL, NULL,
   NULL, NULL),
   
  (1, 1, 1, 'Exame', '2026-02-12 08:00', 'Bateria de exames laboratoriais', NULL, NULL,
   NULL, NULL,
   'Laboratorial', 'Glicemia: 98 mg/dL | Colesterol Total: 210 mg/dL | Creatinina: 1.0 mg/dL', 'Exames dentro da normalidade para a faixa etária e comorbidades.',
   NULL, NULL, NULL, NULL,
   NULL, NULL, NULL,
   NULL, NULL),
   
  (1, 1, 1, 'Medicação', '2026-02-15 10:00', 'Ajuste de prescrição anti-hipertensiva', NULL, NULL,
   NULL, NULL,
   NULL, NULL, NULL,
   'Losartana Potássica', '50mg', '1 comprimido a cada 12h', 'Uso contínuo',
   NULL, NULL, NULL,
   NULL, NULL),

  (1, 2, 3, 'Consulta', '2026-03-05 22:40', 'Procura espontânea na UPA com dor torácica.', 'Suspeita de angina instável', 'Paciente suado e com dispneia.',
   'Dor em aperto retroesternal, irradiação para MSE.', 'ECG com supra de ST anterior.',
   NULL, NULL, NULL,
   NULL, NULL, NULL, NULL,
   NULL, NULL, NULL,
   NULL, NULL),

  (1, 3, 4, 'Internação', '2026-03-06 01:10', 'Internação para investigação cardíaca e estabilização.', 'Infarto Agudo do Miocárdio', NULL,
   NULL, NULL,
   NULL, NULL, NULL,
   NULL, NULL, NULL, NULL,
   '2026-03-06 01:10', '2026-03-10 14:00', 'Cardiologia Intensiva',
   NULL, NULL),
   
  (1, 3, 4, 'Observação', '2026-03-10 14:30', 'Orientações de alta hospitalar', NULL, NULL,
   NULL, NULL,
   NULL, NULL, NULL,
   NULL, NULL, NULL, NULL,
   NULL, NULL, NULL,
   'Repouso absoluto por 15 dias. Dieta hipossódica.', 'Retornar na UBS em 7 dias.');

-- Maria (id 2): UBS -> Clínica privada  (público + privado)
INSERT INTO atendimento
  (paciente_id, profissional_id, unidade_id, tipo, data_hora, descricao, diagnostico, observacoes, sintomas, evolucao_medica) VALUES
  (2, 1, 1, 'Consulta', '2026-01-18 08:30', 'Consulta de rotina para renovar receita', 'Hipertensão', 'Ajuste de dose realizado.', 'Nenhum sintoma relatado.', 'PA 140x90. Exame físico sem alterações.');

INSERT INTO atendimento
  (paciente_id, profissional_id, unidade_id, tipo, data_hora, descricao, categoria_exame, resultados, laudos) VALUES
  (2, 4, 6, 'Exame', '2026-01-25 14:00', 'Exames laboratoriais (perfil lipídico).', 'Laboratorial', 'Colesterol LDL: 160 mg/dL', 'Dislipidemia leve. Necessita ajuste alimentar.');

-- Roberto (id 5): alerta de anticoagulante — atendimento único na UPA
INSERT INTO atendimento
  (paciente_id, profissional_id, unidade_id, tipo, data_hora, descricao, diagnostico, observacoes, sintomas, evolucao_medica) VALUES
  (5, 2, 3, 'Consulta', '2026-04-02 19:20', 'Corte profundo no antebraço esquerdo.', 'Laceração', 'ALERTA: uso de varfarina considerado na conduta.', 'Sangramento abundante.', 'Sutura simples realizada. Hemostasia alcançada com dificuldade devido anticoagulante.');

-- Carlos (id 3) e Ana (id 4): sem atendimentos ainda
-- (úteis para testar busca de paciente sem histórico).

-- ---------- LOG DE ACESSO (exemplos) -------------------------
INSERT INTO log_acesso (profissional_id, paciente_id, acao) VALUES
  (1, 1, 'visualizou_ficha'),
  (3, 1, 'visualizou_timeline'),
  (4, 2, 'visualizou_ficha');

-- =============================================================
-- Consulta da TIMELINE UNIFICADA (a tese do projeto):
--
--   SELECT a.data_hora, a.tipo, a.descricao,
--          u.nome AS unidade, u.natureza, p.nome AS profissional
--     FROM atendimento a
--     JOIN unidade      u ON u.id = a.unidade_id
--     JOIN profissional p ON p.id = a.profissional_id
--    WHERE a.paciente_id = 1
--    ORDER BY a.data_hora;
--
-- Para o paciente 1 (João), retorna atendimentos em
-- UBS (pública), UPA (pública) e Santa Casa (filantrópica)
-- num único histórico — exatamente o que o sistema demonstra.
-- =============================================================
