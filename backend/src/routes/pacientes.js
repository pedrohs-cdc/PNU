// Rotas de pacientes — controller slim.
// Toda lógica de negócio está em services/; aqui apenas:
//   1. Parsear request  2. Chamar service  3. Retornar response.

const express = require('express');
const { authenticate, requireRole } = require('../middleware/auth');
const { asyncH } = require('../utils/asyncH');
const pacienteService = require('../services/paciente.service');
const atendimentoService = require('../services/atendimento.service');

const router = express.Router();
router.use(authenticate);

// GET /api/pacientes/busca?q=...
router.get('/busca', asyncH(async (req, res) => {
  const q = (req.query.q || '').trim();
  if (q.length < 2) {
    return res.status(400).json({ erro: 'Informe ao menos 2 caracteres.' });
  }
  const resultado = await pacienteService.buscarPaciente(q);
  res.json(resultado);
}));

// GET /api/pacientes/:id — ficha completa + alertas (auditado)
router.get('/:id', asyncH(async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ erro: 'ID inválido.' });
  }
  const resultado = await pacienteService.obterFicha(id, req.user.id);
  if (!resultado) return res.status(404).json({ erro: 'Paciente não encontrado.' });
  res.json(resultado);
}));

// GET /api/pacientes/:id/timeline — histórico unificado (auditado)
router.get('/:id/timeline', asyncH(async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ erro: 'ID inválido.' });
  }
  const resultado = await pacienteService.obterTimeline(id, req.user.id, req.user.role);
  if (!resultado) return res.status(404).json({ erro: 'Paciente não encontrado.' });
  res.json(resultado);
}));

// POST /api/pacientes/:id/atendimentos — só médico
router.post('/:id/atendimentos', requireRole('medico'), asyncH(async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ erro: 'ID inválido.' });
  }
  const resultado = await atendimentoService.criarAtendimento({
    pacienteId: id,
    profissionalId: req.user.id,
    unidadeId: req.user.unidade_id,  // sempre do token — nunca do cliente
    tipo: req.body?.tipo,
    descricao: req.body?.descricao,
    diagnostico: req.body?.diagnostico,
    observacoes: req.body?.observacoes,
    dataHora: req.body?.data_hora,
    sintomas: req.body?.sintomas,
    evolucaoMedica: req.body?.evolucao_medica,
    categoriaExame: req.body?.categoria_exame,
    resultados: req.body?.resultados,
    laudos: req.body?.laudos,
    medicamentosPrescritos: req.body?.medicamentos_prescritos,
    dosagem: req.body?.dosagem,
    frequencia: req.body?.frequencia,
    duracao: req.body?.duracao,
    dataEntrada: req.body?.data_entrada,
    dataAlta: req.body?.data_alta,
    setor: req.body?.setor,
    recomendacoes: req.body?.recomendacoes,
    retornos: req.body?.retornos
  });
  if (resultado.erro) {
    return res.status(resultado.status).json({ erro: resultado.erro });
  }
  res.status(201).json({ ok: true, ...resultado });
}));

// GET /api/pacientes/:id/log — só médico
router.get('/:id/log', requireRole('medico'), asyncH(async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ erro: 'ID inválido.' });
  }
  const resultado = await atendimentoService.obterLog(id);
  if (!resultado) return res.status(404).json({ erro: 'Paciente não encontrado.' });
  res.json(resultado);
}));

module.exports = router;
