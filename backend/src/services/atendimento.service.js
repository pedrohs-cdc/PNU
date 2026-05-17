// Camada de serviço — lógica de negócio de atendimentos.

const { query } = require('../db');

const TIPOS_VALIDOS = ['Consulta', 'Exame', 'Medicação', 'Internação', 'Observação'];

/**
 * Cria um novo atendimento clínico vinculado à unidade do profissional.
 * A unidade vem sempre do token JWT — nunca do cliente.
 * @param {{ 
 *   pacienteId: number, profissionalId: number, unidadeId: number, 
 *   tipo: string, descricao: string, diagnostico?: string, observacoes?: string, dataHora?: string,
 *   sintomas?: string, evolucaoMedica?: string,
 *   categoriaExame?: string, resultados?: string, laudos?: string,
 *   medicamentosPrescritos?: string, dosagem?: string, frequencia?: string, duracao?: string,
 *   dataEntrada?: string, dataAlta?: string, setor?: string,
 *   recomendacoes?: string, retornos?: string
 * }} params
 * @returns {{ atendimento_id: number, unidade_id: number } | { erro: string, status: number }}
 */
async function criarAtendimento({ 
  pacienteId, profissionalId, unidadeId, tipo, descricao, diagnostico, observacoes, dataHora,
  sintomas, evolucaoMedica,
  categoriaExame, resultados, laudos,
  medicamentosPrescritos, dosagem, frequencia, duracao,
  dataEntrada, dataAlta, setor,
  recomendacoes, retornos
}) {
  if (!tipo || !TIPOS_VALIDOS.includes(tipo)) {
    return { erro: `tipo inválido. Use um de: ${TIPOS_VALIDOS.join(', ')}.`, status: 400 };
  }

  if (!descricao?.trim()) {
    return { erro: 'descricao é obrigatória.', status: 400 };
  }

  const existe = await query('SELECT 1 FROM paciente WHERE id = $1', [pacienteId]);
  if (existe.length === 0) {
    return { erro: 'Paciente não encontrado.', status: 404 };
  }

  const quando = dataHora ? new Date(dataHora) : new Date();
  if (isNaN(quando.getTime())) {
    return { erro: 'data_hora inválida.', status: 400 };
  }

  const parseDate = (d) => {
    if (!d) return null;
    const date = new Date(d);
    return isNaN(date.getTime()) ? null : date;
  };

  const rows = await query(
    `INSERT INTO atendimento
       (paciente_id, profissional_id, unidade_id, tipo, data_hora, descricao, diagnostico, observacoes,
        sintomas, evolucao_medica, 
        categoria_exame, resultados, laudos, 
        medicamentos_prescritos, dosagem, frequencia, duracao, 
        data_entrada, data_alta, setor, 
        recomendacoes, retornos)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
     RETURNING id`,
    [
      pacienteId, profissionalId, unidadeId, tipo, quando, descricao.trim(), diagnostico || null, observacoes || null,
      sintomas || null, evolucaoMedica || null,
      categoriaExame || null, resultados || null, laudos || null,
      medicamentosPrescritos || null, dosagem || null, frequencia || null, duracao || null,
      parseDate(dataEntrada), parseDate(dataAlta), setor || null,
      recomendacoes || null, retornos || null
    ]
  );

  await query(
    'INSERT INTO log_acesso (profissional_id, paciente_id, acao) VALUES ($1, $2, $3)',
    [profissionalId, pacienteId, 'criou_atendimento']
  );

  return { atendimento_id: rows[0].id, unidade_id: unidadeId };
}

/**
 * Retorna o log de acesso ao prontuário de um paciente.
 * @param {number} pacienteId
 * @returns {{ total: number, log: object[] } | null}
 */
async function obterLog(pacienteId) {
  const existe = await query('SELECT 1 FROM paciente WHERE id = $1', [pacienteId]);
  if (existe.length === 0) return null;

  const rows = await query(
    `SELECT l.acao, l.timestamp,
            p.nome AS profissional, p.role,
            u.nome AS unidade
       FROM log_acesso l
       JOIN profissional p ON p.id = l.profissional_id
       JOIN unidade      u ON u.id = p.unidade_id
      WHERE l.paciente_id = $1
      ORDER BY l.timestamp DESC`,
    [pacienteId]
  );

  return { total: rows.length, log: rows };
}

/** Lista de tipos válidos (exportada para uso em validações externas). */
const TIPOS = TIPOS_VALIDOS;

module.exports = { criarAtendimento, obterLog, TIPOS };
