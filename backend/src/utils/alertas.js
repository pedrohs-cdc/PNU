/**
 * Deriva alertas clínicos a partir dos campos `alergias` e `doencas_cronicas`
 * do paciente. Cada item separado por vírgula ou ponto-e-vírgula vira um alerta.
 *
 * Regra de severidade:
 *   - Toda alergia = "critico" (destaque vermelho na Fase 7).
 *   - Doença crônica = "critico" se contiver palavra-chave de alto risco,
 *     caso contrário = "atencao" (destaque amarelo).
 */

/** Palavras-chave que elevam uma doença crônica para severidade "critico". */
const PALAVRAS_CRITICAS = [
  'anticoagul', 'varfarina', 'warfarin',
  'contagios', 'infectocontagios',
  'alergia grave', 'anafila',
  'diabetes', 'insulina',
  'hipertensão', 'hipertensao',
  'epilepsia', 'convulsão', 'convulsao',
  'hemofilia', 'insuficiencia', 'insuficiência',
  'oncologico', 'oncológico', 'quimioterapia',
];

/**
 * Divide um campo de texto em itens individuais (separa por vírgula ou ponto-e-vírgula).
 * @param {string | null} campo
 * @returns {string[]}
 */
function split(campo) {
  if (!campo) return [];
  return campo.split(/[;,]/).map((s) => s.trim()).filter(Boolean);
}

/**
 * Determina a severidade de uma doença crônica.
 * @param {string} texto
 * @returns {'critico' | 'atencao'}
 */
function severidade(texto) {
  const normalizado = texto.toLowerCase();
  return PALAVRAS_CRITICAS.some((k) => normalizado.includes(k)) ? 'critico' : 'atencao';
}

/**
 * Deriva alertas clínicos a partir dos dados do paciente.
 * @param {{ alergias?: string | null, doencas_cronicas?: string | null }} paciente
 * @returns {{ tipo: string, descricao: string, severidade: 'critico' | 'atencao' }[]}
 */
function derivarAlertas(paciente) {
  const alertas = [];

  for (const alergia of split(paciente.alergias)) {
    alertas.push({ tipo: 'Alergia', descricao: alergia, severidade: 'critico' });
  }

  for (const doenca of split(paciente.doencas_cronicas)) {
    alertas.push({ tipo: 'Doença crônica', descricao: doenca, severidade: severidade(doenca) });
  }

  return alertas;
}

module.exports = { derivarAlertas, PALAVRAS_CRITICAS };
