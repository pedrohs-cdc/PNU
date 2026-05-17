-- =============================================================
-- PNU — Prontuário Unificado
-- Fase 1: Schema (PostgreSQL)
--
-- Protótipo acadêmico. NÃO usar em produção.
-- Cenário: Franca/SP. Todos os dados são SINTÉTICOS.
-- =============================================================

-- Recria do zero (ambiente de desenvolvimento)
DROP TABLE IF EXISTS log_acesso   CASCADE;
DROP TABLE IF EXISTS atendimento  CASCADE;
DROP TABLE IF EXISTS profissional CASCADE;
DROP TABLE IF EXISTS paciente     CASCADE;
DROP TABLE IF EXISTS unidade      CASCADE;

-- -------------------------------------------------------------
-- UNIDADE
-- natureza distingue público / filantrópico / privado:
-- é o que torna explícita a heterogeneidade real de Franca.
-- -------------------------------------------------------------
CREATE TABLE unidade (
    id        SERIAL PRIMARY KEY,
    nome      VARCHAR(120) NOT NULL,
    tipo      VARCHAR(20)  NOT NULL
              CHECK (tipo IN ('UBS','UPA','Hospital','Ambulatorio','Clinica')),
    natureza  VARCHAR(15)  NOT NULL
              CHECK (natureza IN ('publica','filantropica','privada')),
    cidade    VARCHAR(80)  NOT NULL DEFAULT 'Franca'
);

-- -------------------------------------------------------------
-- PROFISSIONAL
-- role limitado a 2 perfis no MVP (médico / recepção).
-- senha_hash guarda hash bcrypt, NUNCA a senha em texto.
-- -------------------------------------------------------------
CREATE TABLE profissional (
    id          SERIAL PRIMARY KEY,
    nome        VARCHAR(120) NOT NULL,
    email       VARCHAR(160) NOT NULL UNIQUE,
    senha_hash  VARCHAR(255) NOT NULL,
    crm         VARCHAR(20),                    -- nulo para recepção
    role        VARCHAR(15)  NOT NULL
                CHECK (role IN ('medico','recepcao')),
    unidade_id  INTEGER NOT NULL REFERENCES unidade(id)
);

-- -------------------------------------------------------------
-- PACIENTE
-- Compartilhado por TODA a rede — não pertence a uma unidade.
-- CNS é o identificador principal (chave usada pela RNDS real).
-- -------------------------------------------------------------
CREATE TABLE paciente (
    id                SERIAL PRIMARY KEY,
    -- Documentação
    cns               VARCHAR(15) NOT NULL UNIQUE,
    cpf               VARCHAR(11) UNIQUE,
    rg                VARCHAR(20),
    certidao          VARCHAR(40),
    rne_rni           VARCHAR(40),
    -- Dados pessoais e filiação
    nome              VARCHAR(120) NOT NULL,
    nome_social       VARCHAR(120),
    genero            VARCHAR(20),
    data_nascimento   DATE NOT NULL,
    sexo              CHAR(1) CHECK (sexo IN ('M','F','O')),
    nacionalidade     VARCHAR(50) DEFAULT 'Brasileira',
    naturalidade      VARCHAR(50),
    nome_mae          VARCHAR(120),
    nome_pai          VARCHAR(120),
    responsavel_legal VARCHAR(120),
    -- Dados civis e físicos
    estado_civil      VARCHAR(20),
    escolaridade      VARCHAR(50),
    tipo_sanguineo    VARCHAR(5),
    cor_raca          VARCHAR(20),
    -- Contatos
    telefone_principal  VARCHAR(20),
    telefone_secundario VARCHAR(20),
    email             VARCHAR(160),
    contato_emergencia VARCHAR(120),
    -- Endereço
    cep               VARCHAR(10),
    rua               VARCHAR(120),
    numero            VARCHAR(20),
    bairro            VARCHAR(50),
    cidade            VARCHAR(80),
    estado            CHAR(2),
    -- Informações médicas
    alergias          TEXT,                     -- alimenta alertas
    doencas_cronicas  TEXT,                     -- alimenta alertas
    deficiencias      TEXT,
    medicamentos_continuos TEXT,
    historico_cirurgico TEXT,
    convenio_medico   VARCHAR(100),
    -- Informações hospitalares
    numero_prontuario VARCHAR(20) UNIQUE,
    unidade_vinculada_id INTEGER REFERENCES unidade(id),
    status_paciente   VARCHAR(20) DEFAULT 'Ativo'
);

-- -------------------------------------------------------------
-- ATENDIMENTO
-- O coração da integração: referencia paciente + unidade.
-- A timeline unificada é só um SELECT ordenado por data_hora.
-- -------------------------------------------------------------
CREATE TABLE atendimento (
    id              SERIAL PRIMARY KEY,
    paciente_id     INTEGER NOT NULL REFERENCES paciente(id),
    profissional_id INTEGER NOT NULL REFERENCES profissional(id),
    unidade_id      INTEGER NOT NULL REFERENCES unidade(id),
    tipo            VARCHAR(30) NOT NULL
                    CHECK (tipo IN ('Consulta','Exame','Medicação','Internação','Observação')),
    data_hora       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    descricao       TEXT,
    diagnostico     TEXT,
    observacoes     TEXT,

    -- Campos específicos para CONSULTA
    sintomas          TEXT,
    evolucao_medica   TEXT,
    
    -- Campos específicos para EXAMES
    categoria_exame   VARCHAR(50), -- 'Laboratorial', 'Imagem', etc
    resultados        TEXT,
    laudos            TEXT,
    
    -- Campos específicos para MEDICAÇÕES
    medicamentos_prescritos TEXT,
    dosagem           VARCHAR(100),
    frequencia        VARCHAR(100),
    duracao           VARCHAR(100),
    
    -- Campos específicos para INTERNAÇÕES
    data_entrada      TIMESTAMP,
    data_alta         TIMESTAMP,
    setor             VARCHAR(100),
    
    -- Campos específicos para OBSERVAÇÕES
    recomendacoes     TEXT,
    retornos          VARCHAR(100)
);

-- -------------------------------------------------------------
-- LOG_ACESSO
-- Prova de LGPD aplicada na prática: quem viu qual prontuário.
-- -------------------------------------------------------------
CREATE TABLE log_acesso (
    id              SERIAL PRIMARY KEY,
    profissional_id INTEGER NOT NULL REFERENCES profissional(id),
    paciente_id     INTEGER NOT NULL REFERENCES paciente(id),
    acao            VARCHAR(40) NOT NULL,        -- ex.: 'visualizou_ficha'
    timestamp       TIMESTAMP NOT NULL DEFAULT now()
);

-- -------------------------------------------------------------
-- ÍNDICES
-- Busca de paciente (CNS/CPF/nome) e a query da timeline.
-- -------------------------------------------------------------
CREATE INDEX idx_paciente_cns        ON paciente (cns);
CREATE INDEX idx_paciente_cpf        ON paciente (cpf);
CREATE INDEX idx_paciente_nome       ON paciente (lower(nome));
CREATE INDEX idx_atend_paciente_data ON atendimento (paciente_id, data_hora);
CREATE INDEX idx_log_paciente        ON log_acesso (paciente_id, timestamp);
