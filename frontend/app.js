// PNU — Fase 7 | app.js
// Toda a lógica de estado e chamadas à API do backend.

const API = window.location.port === '3000'
  ? `${window.location.protocol}//${window.location.hostname}:3001`
  : window.location.origin;

// ── ESTADO ──────────────────────────────────────────────────
const state = {
  token: null,
  user: null,
  currentPatient: null,
  currentTab: 'timeline',
  timelineEvents: [],
  timelinePerfil: '',
  currentTimelineFilter: 'Todos',
};

// ── UTILS ───────────────────────────────────────────────────
function $(id) { return document.getElementById(id); }

function showScreen(name) {
  document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
  $(`screen-${name}`).classList.remove('hidden');
}

function showPage(name) {
  document.querySelectorAll('.page-section').forEach(p => p.classList.add('hidden'));
  $(`page-${name}`).classList.remove('hidden');
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const nav = document.querySelector(`.nav-item[data-page="${name}"]`);
  if (nav) nav.classList.add('active');
}

function toast(msg, type = 'info') {
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `<span>${type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ'}</span> ${esc(msg)}`;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3500);
}

function setTopbar(title, sub = '') {
  $('topbar-title').textContent = title;
  $('topbar-sub').textContent = sub;
}

function calcIdade(dataNasc) {
  const hoje = new Date();
  const nasc = new Date(dataNasc);
  let age = hoje.getFullYear() - nasc.getFullYear();
  const m = hoje.getMonth() - nasc.getMonth();
  if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) age--;
  return age;
}

function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR', { day:'2-digit', month:'2-digit', year:'numeric' });
}

function formatDateTime(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' });
}

function formatCNS(cns) {
  if (!cns) return '—';
  return cns.replace(/(\d{3})(\d{4})(\d{4})(\d{4})/, '$1 $2 $3 $4');
}

function formatCPF(cpf) {
  if (!cpf) return '—';
  return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

// Escapa qualquer valor antes de injetar em HTML (defesa contra XSS).
// Aplicar em TODO dado vindo do backend / digitado pelo usuário.
function esc(v) {
  if (v === null || v === undefined) return '';
  return String(v).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

// ── API ─────────────────────────────────────────────────────
async function apiFetch(path, opts = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (state.token) headers['Authorization'] = `Bearer ${state.token}`;
  const res = await fetch(`${API}${path}`, { ...opts, headers: { ...headers, ...opts.headers } });
  const data = await res.json();
  if (!res.ok) throw Object.assign(new Error(data.erro || 'Erro'), { status: res.status });
  return data;
}

// ── AUTH ─────────────────────────────────────────────────────
async function handleLogin(e) {
  e.preventDefault();
  const btn = $('login-btn');
  const errEl = $('login-error');
  errEl.classList.add('hidden');
  btn.disabled = true;
  btn.textContent = 'Autenticando...';

  try {
    const { token, profissional } = await apiFetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: $('email').value.trim(),
        senha: $('senha').value,
      }),
    });
    state.token = token;
    state.user = profissional;
    localStorage.setItem('pnu_token', token);
    localStorage.setItem('pnu_user', JSON.stringify(profissional));
    initApp();
  } catch (err) {
    errEl.textContent = err.message;
    errEl.classList.remove('hidden');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Entrar no Sistema';
  }
}

function handleLogout() {
  state.token = null;
  state.user = null;
  state.currentPatient = null;
  localStorage.removeItem('pnu_token');
  localStorage.removeItem('pnu_user');
  showScreen('login');
}

// ── INIT ─────────────────────────────────────────────────────
function initApp() {
  // Sidebar user info
  const roleLabel = state.user.role === 'medico' ? 'Médico' : 'Recepção';
  $('user-name').textContent = state.user.nome;
  $('user-role').textContent = roleLabel;
  $('user-role').className = `user-role role-${state.user.role}`;

  // Mostrar/esconder nav items por perfil
  document.querySelectorAll('[data-role]').forEach(el => {
    const required = el.dataset.role;
    if (required && required !== state.user.role) el.classList.add('hidden');
  });

  showScreen('app');
  showPage('busca');
  setTopbar('Busca de Paciente', 'Pesquise por CNS, CPF ou nome');
}

// ── BUSCA ────────────────────────────────────────────────────
async function handleSearch() {
  const q = $('search-input').value.trim();
  if (q.length < 2) { toast('Informe ao menos 2 caracteres.', 'error'); return; }

  const resultsEl = $('search-results');
  resultsEl.innerHTML = '<div class="spinner"></div>';

  try {
    const { modo, total, pacientes } = await apiFetch(`/api/pacientes/busca?q=${encodeURIComponent(q)}`);

    if (total === 0) {
      resultsEl.innerHTML = `
        <div class="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <p>Nenhum paciente encontrado para <strong>"${esc(q)}"</strong></p>
        </div>`;
      return;
    }

    const modoTexto = { cns: 'CNS', cpf: 'CPF', nome: 'nome' }[modo] || modo;
    resultsEl.innerHTML = `<div class="results-label">${total} resultado${total > 1 ? 's' : ''} — busca por ${esc(modoTexto)}</div>` +
      pacientes.map(p => `
        <div class="patient-card" onclick="openFicha(${Number(p.id)})" tabindex="0" role="button" aria-label="Abrir ficha de ${esc(p.nome)}">
          <div>
            <div class="pc-name">${esc(p.nome)}</div>
            <div class="pc-meta">CNS ${esc(formatCNS(p.cns))} · CPF ${esc(formatCPF(p.cpf))} · ${calcIdade(p.data_nascimento)} anos · ${p.sexo === 'M' ? 'Masculino' : p.sexo === 'F' ? 'Feminino' : 'Outro'}</div>
          </div>
          <span class="pc-arrow">›</span>
        </div>`
      ).join('');
  } catch (err) {
    toast(err.message, 'error');
    resultsEl.innerHTML = '';
  }
}

// ── FICHA ────────────────────────────────────────────────────
async function openFicha(id) {
  showPage('ficha');
  setTopbar('Carregando ficha...', '');
  $('ficha-content').innerHTML = '<div class="spinner"></div>';

  try {
    const { paciente, alertas } = await apiFetch(`/api/pacientes/${id}`);
    state.currentPatient = paciente;
    renderFicha(paciente, alertas);
    loadTab(state.currentTab, id);
  } catch (err) {
    toast(err.message, 'error');
    showPage('busca');
  }
}

function renderFicha(p, alertas) {
  setTopbar('Ficha do Paciente', p.nome);

  const isMedico = state.user.role === 'medico';

  $('ficha-content').innerHTML = `
    <div class="ficha-header">
      <div>
        <div class="ficha-name">${esc(p.nome)}</div>
        ${p.nome_social ? `<div class="ficha-social">Nome social: ${esc(p.nome_social)}</div>` : ''}
        <div class="ficha-ids">
          <span class="ficha-id"><strong>CNS</strong>${esc(formatCNS(p.cns))}</span>
          <span class="ficha-id"><strong>CPF</strong>${esc(formatCPF(p.cpf))}</span>
        </div>
      </div>
      <button class="btn-back" onclick="showPage('busca');setTopbar('Busca de Paciente','Pesquise por CNS, CPF ou nome')">← Voltar</button>
    </div>

    ${alertas.length ? `
    <div class="alertas-section">
      <div class="alertas-title">⚠ Alertas Clínicos</div>
      <div class="alertas-grid">
        ${alertas.map(a => `
          <div class="alerta-badge ${esc(a.severidade)}" title="${esc(a.tipo)}">
            <span class="alerta-dot"></span>
            <span><strong>${esc(a.tipo)}:</strong> ${esc(a.descricao)}</span>
          </div>`).join('')}
      </div>
    </div>` : ''}

    <!-- DADOS PESSOAIS -->
    <div class="section-title">Dados Pessoais</div>
    <div class="dados-grid">
      <div class="dado-item"><div class="dado-label">Data de Nascimento</div><div class="dado-valor">${formatDate(p.data_nascimento)}</div></div>
      <div class="dado-item"><div class="dado-label">Idade</div><div class="dado-valor">${calcIdade(p.data_nascimento)} anos</div></div>
      <div class="dado-item"><div class="dado-label">Sexo / Gênero</div><div class="dado-valor">${p.sexo === 'M' ? 'Masculino' : p.sexo === 'F' ? 'Feminino' : 'Outro'} / ${esc(p.genero || 'Não informado')}</div></div>
      <div class="dado-item"><div class="dado-label">Nacionalidade</div><div class="dado-valor">${esc(p.nacionalidade || '—')}</div></div>
      <div class="dado-item"><div class="dado-label">Naturalidade</div><div class="dado-valor">${esc(p.naturalidade || '—')}</div></div>
    </div>

    <!-- FILIAÇÃO -->
    <div class="section-title">Filiação</div>
    <div class="dados-grid">
      <div class="dado-item"><div class="dado-label">Nome da Mãe</div><div class="dado-valor">${esc(p.nome_mae || '—')}</div></div>
      <div class="dado-item"><div class="dado-label">Nome do Pai</div><div class="dado-valor">${esc(p.nome_pai || '—')}</div></div>
      <div class="dado-item"><div class="dado-label">Responsável Legal</div><div class="dado-valor">${esc(p.responsavel_legal || '—')}</div></div>
    </div>

    <!-- DOCUMENTAÇÃO -->
    <div class="section-title">Documentação</div>
    <div class="dados-grid">
      <div class="dado-item"><div class="dado-label">RG</div><div class="dado-valor">${esc(p.rg || '—')}</div></div>
      <div class="dado-item"><div class="dado-label">Certidão</div><div class="dado-valor">${esc(p.certidao || '—')}</div></div>
      <div class="dado-item"><div class="dado-label">RNE / RNI</div><div class="dado-valor">${esc(p.rne_rni || '—')}</div></div>
    </div>

    <!-- DADOS CIVIS E FÍSICOS -->
    <div class="section-title">Dados Civis e Físicos</div>
    <div class="dados-grid">
      <div class="dado-item"><div class="dado-label">Estado Civil</div><div class="dado-valor">${esc(p.estado_civil || '—')}</div></div>
      <div class="dado-item"><div class="dado-label">Escolaridade</div><div class="dado-valor">${esc(p.escolaridade || '—')}</div></div>
      <div class="dado-item"><div class="dado-label">Cor / Raça</div><div class="dado-valor">${esc(p.cor_raca || '—')}</div></div>
      <div class="dado-item"><div class="dado-label">Tipo Sanguíneo</div><div class="dado-valor">${esc(p.tipo_sanguineo || '—')}</div></div>
    </div>

    <!-- CONTATOS E ENDEREÇO -->
    <div class="section-title">Contatos e Endereço</div>
    <div class="dados-grid">
      <div class="dado-item"><div class="dado-label">Telefone Principal</div><div class="dado-valor">${esc(p.telefone_principal || '—')}</div></div>
      <div class="dado-item"><div class="dado-label">Contato de Emergência</div><div class="dado-valor">${esc(p.contato_emergencia || '—')}</div></div>
      <div class="dado-item"><div class="dado-label">E-mail</div><div class="dado-valor">${esc(p.email || '—')}</div></div>
      <div class="dado-item" style="grid-column:1/-1"><div class="dado-label">Endereço Completo</div><div class="dado-valor">${esc([p.rua, p.numero, p.bairro, p.cidade, p.estado, p.cep].filter(Boolean).join(', ') || '—')}</div></div>
    </div>

    <!-- INFORMAÇÕES MÉDICAS -->
    <div class="section-title">Informações Médicas Importantes</div>
    <div class="dados-grid">
      <div class="dado-item"><div class="dado-label">Alergias</div><div class="dado-valor">${esc(p.alergias || 'Nenhuma')}</div></div>
      <div class="dado-item"><div class="dado-label">Doenças Crônicas</div><div class="dado-valor">${esc(p.doencas_cronicas || 'Nenhuma')}</div></div>
      <div class="dado-item"><div class="dado-label">Deficiências</div><div class="dado-valor">${esc(p.deficiencias || 'Nenhuma')}</div></div>
      <div class="dado-item"><div class="dado-label">Uso Contínuo de Medicamentos</div><div class="dado-valor">${esc(p.medicamentos_continuos || 'Nenhum')}</div></div>
      <div class="dado-item" style="grid-column:2/-1"><div class="dado-label">Histórico Cirúrgico</div><div class="dado-valor">${esc(p.historico_cirurgico || 'Nenhum')}</div></div>
    </div>

    <!-- INFORMAÇÕES HOSPITALARES -->
    <div class="section-title">Informações Hospitalares</div>
    <div class="dados-grid" style="margin-bottom: 32px;">
      <div class="dado-item"><div class="dado-label">Unidade Vinculada</div><div class="dado-valor">${esc(p.unidade_vinculada_nome || '—')}</div></div>
      <div class="dado-item"><div class="dado-label">Nº do Prontuário</div><div class="dado-valor">${esc(p.numero_prontuario || '—')}</div></div>
      <div class="dado-item"><div class="dado-label">Convênio Médico</div><div class="dado-valor">${esc(p.convenio_medico || '—')}</div></div>
      <div class="dado-item"><div class="dado-label">Data do Primeiro Atendimento</div><div class="dado-valor">${formatDateTime(p.data_primeiro_atendimento)}</div></div>
      <div class="dado-item"><div class="dado-label">Último Atendimento</div><div class="dado-valor">${formatDateTime(p.data_ultimo_atendimento)}</div></div>
      <div class="dado-item"><div class="dado-label">Status do Paciente</div><div class="dado-valor">
        <span style="display:inline-block;padding:2px 8px;border-radius:12px;background:${p.status_paciente === 'Ativo' ? '#EBF9F4' : '#FEF0EE'};color:${p.status_paciente === 'Ativo' ? 'var(--green)' : 'var(--red)'};font-size:12px;font-weight:700;">
          ${esc(p.status_paciente || 'Desconhecido')}
        </span>
      </div></div>
    </div>

    <div class="tabs">
      <button class="tab-btn ${state.currentTab === 'timeline' ? 'active' : ''}" onclick="setTab('timeline',${Number(p.id)})">📋 Timeline Unificada</button>
      ${isMedico ? `<button class="tab-btn ${state.currentTab === 'atendimento' ? 'active' : ''}" onclick="setTab('atendimento',${Number(p.id)})">➕ Novo Atendimento</button>` : ''}
      ${isMedico ? `<button class="tab-btn ${state.currentTab === 'log' ? 'active' : ''}" onclick="setTab('log',${Number(p.id)})">🔒 Log de Acesso</button>` : ''}
    </div>
    <div id="tab-content"></div>
  `;
}

function setTab(tab, id) {
  state.currentTab = tab;
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  event.target.classList.add('active');
  loadTab(tab, id);
}

async function loadTab(tab, id) {
  const el = $('tab-content');
  if (!el) return;

  if (tab === 'timeline') {
    el.innerHTML = '<div class="spinner"></div>';
    try {
      const { timeline, perfil } = await apiFetch(`/api/pacientes/${id}/timeline`);
      state.timelineEvents = timeline;
      state.timelinePerfil = perfil;
      state.currentTimelineFilter = 'Todos';
      renderTimeline(el, timeline, perfil);
    } catch (err) { toast(err.message, 'error'); }

  } else if (tab === 'atendimento') {
    renderFormAtendimento(el, id);

  } else if (tab === 'log') {
    el.innerHTML = '<div class="spinner"></div>';
    try {
      const { log } = await apiFetch(`/api/pacientes/${id}/log`);
      renderLog(el, log);
    } catch (err) { toast(err.message, 'error'); }
  }
}

// ── TIMELINE ─────────────────────────────────────────────────
function renderTimeline(el, eventos, perfil) {
  el.innerHTML = `
    <div class="timeline-filters">
      <button class="filter-btn active" data-filter="Todos" onclick="setTimelineFilter('Todos')">Todos</button>
      <button class="filter-btn" data-filter="Consulta" onclick="setTimelineFilter('Consulta')">Consultas</button>
      <button class="filter-btn" data-filter="Exame" onclick="setTimelineFilter('Exame')">Exames</button>
      <button class="filter-btn" data-filter="Medicação" onclick="setTimelineFilter('Medicação')">Medicações</button>
      <button class="filter-btn" data-filter="Internação" onclick="setTimelineFilter('Internação')">Internações</button>
      <button class="filter-btn" data-filter="Observação" onclick="setTimelineFilter('Observação')">Observações</button>
    </div>
    <p style="font-size:12px;color:var(--gray-4);margin-bottom:16px" id="timeline-count">
      ${eventos.length} prontuário${eventos.length > 1 ? 's' : ''} · Perfil: ${perfil === 'medico' ? 'Médico (visão completa)' : 'Recepção (visão resumida)'}
    </p>
    <div class="timeline" id="timeline-list"></div>
  `;
  renderTimelineItems($('timeline-list'), eventos, perfil);
}

function setTimelineFilter(filter) {
  state.currentTimelineFilter = filter;
  document.querySelectorAll('.filter-btn').forEach(b => {
    if (b.dataset.filter === filter) b.classList.add('active');
    else b.classList.remove('active');
  });

  let filtered = state.timelineEvents;
  if (filter !== 'Todos') {
    filtered = state.timelineEvents.filter(e => e.tipo === filter);
  }

  const listEl = $('timeline-list');
  if (listEl) {
    renderTimelineItems(listEl, filtered, state.timelinePerfil);
  }
}

function renderTimelineItems(listEl, eventos, perfil) {
  const countEl = $('timeline-count');
  if (countEl) {
    countEl.innerHTML = `<strong>${eventos.length}</strong> prontuário${eventos.length > 1 ? 's' : ''} · Perfil: ${perfil === 'medico' ? 'Médico (visão completa)' : 'Recepção (visão resumida)'}`;
  }

  if (!eventos.length) {
    listEl.innerHTML = `<div class="empty-state">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/></svg>
      <p>Nenhum prontuário nesta categoria.</p></div>`;
    return;
  }

  const ehMedico = perfil === 'medico';

  listEl.innerHTML = eventos.map((e, i) => {
    const cleanTipo = e.tipo.normalize('NFD').replace(/[\u0300-\u036f]/g, "");
    let extraFieldsHTML = '';

    if (ehMedico) {
      if (e.tipo === 'Consulta') {
        extraFieldsHTML = `
          <div class="tc-fields-grid">
            ${e.sintomas ? `<div class="tc-field"><div class="tc-field-label">Sintomas Relatados</div><div class="tc-field-value">${esc(e.sintomas)}</div></div>` : ''}
            ${e.diagnostico ? `<div class="tc-field"><div class="tc-field-label">Diagnóstico</div><div class="tc-field-value"><strong>${esc(e.diagnostico)}</strong></div></div>` : ''}
            ${e.observacoes ? `<div class="tc-field tc-fields-grid-full"><div class="tc-field-label">Observações Clínicas</div><div class="tc-field-value">${esc(e.observacoes)}</div></div>` : ''}
            ${e.evolucao_medica ? `<div class="tc-field tc-fields-grid-full"><div class="tc-field-box"><div class="tc-field-label">Evolução Médica</div><div class="tc-field-value">${esc(e.evolucao_medica)}</div></div></div>` : ''}
          </div>
        `;
      } else if (e.tipo === 'Exame') {
        extraFieldsHTML = `
          <div class="tc-fields-grid">
            <div class="tc-field"><div class="tc-field-label">Categoria de Exame</div><div class="tc-field-value">${esc(e.categoria_exame || 'Não especificada')}</div></div>
            ${e.resultados ? `<div class="tc-field"><div class="tc-field-label">Resultados</div><div class="tc-field-value">${esc(e.resultados)}</div></div>` : ''}
            ${e.laudos ? `<div class="tc-field tc-fields-grid-full"><div class="tc-field-box box-sucesso"><div class="tc-field-label">Laudo Oficial</div><div class="tc-field-value">${esc(e.laudos)}</div></div></div>` : ''}
          </div>
        `;
      } else if (e.tipo === 'Medicação') {
        extraFieldsHTML = `
          <div class="tc-fields-grid">
            <div class="tc-field"><div class="tc-field-label">Medicamento Prescrito</div><div class="tc-field-value"><strong>💊 ${esc(e.medicamentos_prescritos || '—')}</strong></div></div>
            <div class="tc-field"><div class="tc-field-label">Dosagem</div><div class="tc-field-value">${esc(e.dosagem || '—')}</div></div>
            <div class="tc-field"><div class="tc-field-label">Frequência</div><div class="tc-field-value">${esc(e.frequencia || '—')}</div></div>
            <div class="tc-field"><div class="tc-field-label">Duração</div><div class="tc-field-value">${esc(e.duracao || '—')}</div></div>
          </div>
        `;
      } else if (e.tipo === 'Internação') {
        extraFieldsHTML = `
          <div class="tc-fields-grid">
            <div class="tc-field"><div class="tc-field-label">Setor / Ala</div><div class="tc-field-value">🏢 ${esc(e.setor || '—')}</div></div>
            <div class="tc-field"><div class="tc-field-label">Status da Internação</div><div class="tc-field-value">${e.data_alta ? 'Alta Concedida' : 'Internado'}</div></div>
            <div class="tc-field"><div class="tc-field-label">Entrada</div><div class="tc-field-value">${formatDateTime(e.data_entrada)}</div></div>
            <div class="tc-field"><div class="tc-field-label">Alta</div><div class="tc-field-value">${formatDateTime(e.data_alta)}</div></div>
          </div>
        `;
      } else if (e.tipo === 'Observação') {
        extraFieldsHTML = `
          <div class="tc-fields-grid">
            ${e.recomendacoes ? `<div class="tc-field tc-fields-grid-full"><div class="tc-field-label">Recomendações Profissionais</div><div class="tc-field-value">${esc(e.recomendacoes)}</div></div>` : ''}
            ${e.retornos ? `<div class="tc-field"><div class="tc-field-label">Previsão de Retorno</div><div class="tc-field-value">📅 ${esc(e.retornos)}</div></div>` : ''}
          </div>
        `;
      }
    } else {
      extraFieldsHTML = `
        <div class="tc-fields-grid">
          <div class="tc-field"><div class="tc-field-label">Tipo</div><div class="tc-field-value">${esc(e.tipo)}</div></div>
          ${e.setor ? `<div class="tc-field"><div class="tc-field-label">Setor Vinculado</div><div class="tc-field-value">${esc(e.setor)}</div></div>` : ''}
        </div>
      `;
    }

    return `
      <div class="timeline-item" style="animation-delay:${i * 40}ms">
        <div class="timeline-dot"></div>
        <div class="timeline-card">
          <div class="tc-header">
            <div>
              <div class="tc-date">${formatDateTime(e.data_hora)}</div>
              <div class="tc-title">${esc(e.descricao || '—')}</div>
            </div>
            <span class="tc-tipo tipo-${esc(cleanTipo)}">${esc(e.tipo)}</span>
          </div>
          ${extraFieldsHTML}
          <div class="tc-unidade" style="margin-top: 14px;">
            <span>🏥 ${esc(e.unidade)}</span>
            <span style="opacity:.6">·</span>
            <span>${esc(e.unidade_tipo)} · ${esc(e.natureza)}</span>
            <span style="opacity:.6">·</span>
            <span>👤 ${esc(e.profissional)}</span>
          </div>
        </div>
      </div>`;
  }).join('');
}

// ── FORM ATENDIMENTO ─────────────────────────────────────────
function renderFormAtendimento(el, pacienteId) {
  el.innerHTML = `
    <div class="atend-form">
      <h3>Registrar Atendimento</h3>
      <form id="form-atend" onsubmit="submitAtendimento(event, ${pacienteId})">
        <div class="form-grid">
          <div class="form-field">
            <label>Tipo *</label>
            <select id="at-tipo" required onchange="handleFormTypeChange()">
              <option value="">Selecione...</option>
              <option value="Consulta">Consulta</option>
              <option value="Exame">Exame</option>
              <option value="Medicação">Medicação</option>
              <option value="Internação">Internação</option>
              <option value="Observação">Observação</option>
            </select>
          </div>
          <div class="form-field">
            <label>Data/Hora</label>
            <input type="datetime-local" id="at-data">
          </div>
          <div class="form-field form-field-full">
            <label>Descrição geral do atendimento *</label>
            <textarea id="at-desc" required placeholder="Ex: Paciente procurou atendimento relatando..."></textarea>
          </div>

          <!-- CAMPOS EXTRAS DINÂMICOS -->
          <div id="form-atend-extras" class="form-field-full form-grid" style="grid-column: 1/-1; gap: 16px; margin: 0; padding: 0;"></div>

        </div>
        <button type="submit" class="btn-submit" id="at-btn" style="margin-top: 24px;">Registrar Prontuário</button>
      </form>
    </div>`;
}

function handleFormTypeChange() {
  const tipo = $('at-tipo').value;
  const extrasEl = $('form-atend-extras');
  if (!extrasEl) return;

  extrasEl.innerHTML = '';

  if (tipo === 'Consulta') {
    extrasEl.innerHTML = `
      <div class="form-field form-field-full">
        <label>Sintomas relatados</label>
        <textarea id="at-sintomas" placeholder="Ex: Cefaleia, febre, tosse..."></textarea>
      </div>
      <div class="form-field form-field-full">
        <label>Diagnóstico (CID / Nome)</label>
        <input type="text" id="at-diag" placeholder="Ex: I10 - Hipertensão essencial" style="width:100%; border:var(--border); border-left:3px solid var(--navy); padding:10px 14px; background:var(--gray-1); outline:none;">
      </div>
      <div class="form-field form-field-full">
        <label>Evolução Clínica / Anotações</label>
        <textarea id="at-evolucao" placeholder="Evolução do paciente durante o atendimento..."></textarea>
      </div>
      <div class="form-field form-field-full">
        <label>Observações</label>
        <textarea id="at-obs" placeholder="Outras observações..."></textarea>
      </div>
    `;
  } else if (tipo === 'Exame') {
    extrasEl.innerHTML = `
      <div class="form-field">
        <label>Categoria de Exame *</label>
        <select id="at-cat-exame" required>
          <option value="Laboratorial">Laboratorial (Sangue, Urina, etc)</option>
          <option value="Imagem">Imagem (Raio-X, Tomografia, etc)</option>
          <option value="Outros">Outros</option>
        </select>
      </div>
      <div class="form-field form-field-full">
        <label>Resultados (Valores rápidos)</label>
        <textarea id="at-resultados" placeholder="Ex: Hemoglobina 14g/dL..."></textarea>
      </div>
      <div class="form-field form-field-full">
        <label>Laudo Oficial</label>
        <textarea id="at-laudos" placeholder="Escreva o laudo detalhado do exame..."></textarea>
      </div>
    `;
  } else if (tipo === 'Medicação') {
    extrasEl.innerHTML = `
      <div class="form-field">
        <label>Medicamento Prescrito *</label>
        <input type="text" id="at-med-prescrito" required placeholder="Ex: Amoxicilina 500mg" style="width:100%; border:var(--border); border-left:3px solid var(--navy); padding:10px 14px; background:var(--gray-1); outline:none;">
      </div>
      <div class="form-field">
        <label>Dosagem *</label>
        <input type="text" id="at-dosagem" required placeholder="Ex: 1 comprimido" style="width:100%; border:var(--border); border-left:3px solid var(--navy); padding:10px 14px; background:var(--gray-1); outline:none;">
      </div>
      <div class="form-field">
        <label>Frequência *</label>
        <input type="text" id="at-frequencia" required placeholder="Ex: A cada 8 horas" style="width:100%; border:var(--border); border-left:3px solid var(--navy); padding:10px 14px; background:var(--gray-1); outline:none;">
      </div>
      <div class="form-field">
        <label>Duração *</label>
        <input type="text" id="at-duracao" required placeholder="Ex: 7 dias" style="width:100%; border:var(--border); border-left:3px solid var(--navy); padding:10px 14px; background:var(--gray-1); outline:none;">
      </div>
    `;
  } else if (tipo === 'Internação') {
    extrasEl.innerHTML = `
      <div class="form-field">
        <label>Setor / Ala *</label>
        <input type="text" id="at-setor" required placeholder="Ex: UTI Adulto" style="width:100%; border:var(--border); border-left:3px solid var(--navy); padding:10px 14px; background:var(--gray-1); outline:none;">
      </div>
      <div class="form-field">
        <label>Data de Entrada *</label>
        <input type="datetime-local" id="at-data-entrada" required style="width:100%;">
      </div>
      <div class="form-field">
        <label>Data de Alta (Se houver)</label>
        <input type="datetime-local" id="at-data-alta" style="width:100%;">
      </div>
    `;
  } else if (tipo === 'Observação') {
    extrasEl.innerHTML = `
      <div class="form-field form-field-full">
        <label>Recomendações Clínicas</label>
        <textarea id="at-recomendacoes" placeholder="Ex: Evitar esforços físicos..."></textarea>
      </div>
      <div class="form-field">
        <label>Previsão de Retorno</label>
        <input type="text" id="at-retornos" placeholder="Ex: Em 15 dias" style="width:100%; border:var(--border); border-left:3px solid var(--navy); padding:10px 14px; background:var(--gray-1); outline:none;">
      </div>
    `;
  }
}

async function submitAtendimento(e, pacienteId) {
  e.preventDefault();
  const btn = $('at-btn');
  btn.disabled = true;
  btn.textContent = 'Registrando...';

  const tipo = $('at-tipo').value;
  const payload = {
    tipo: tipo,
    descricao: $('at-desc').value,
    data_hora: $('at-data').value || undefined,
  };

  if (tipo === 'Consulta') {
    payload.sintomas = $('at-sintomas')?.value || undefined;
    payload.diagnostico = $('at-diag')?.value || undefined;
    payload.evolucao_medica = $('at-evolucao')?.value || undefined;
    payload.observacoes = $('at-obs')?.value || undefined;
  } else if (tipo === 'Exame') {
    payload.categoria_exame = $('at-cat-exame')?.value || undefined;
    payload.resultados = $('at-resultados')?.value || undefined;
    payload.laudos = $('at-laudos')?.value || undefined;
  } else if (tipo === 'Medicação') {
    payload.medicamentos_prescritos = $('at-med-prescrito')?.value || undefined;
    payload.dosagem = $('at-dosagem')?.value || undefined;
    payload.frequencia = $('at-frequencia')?.value || undefined;
    payload.duracao = $('at-duracao')?.value || undefined;
  } else if (tipo === 'Internação') {
    payload.setor = $('at-setor')?.value || undefined;
    payload.data_entrada = $('at-data-entrada')?.value || undefined;
    payload.data_alta = $('at-data-alta')?.value || undefined;
  } else if (tipo === 'Observação') {
    payload.recomendacoes = $('at-recomendacoes')?.value || undefined;
    payload.retornos = $('at-retornos')?.value || undefined;
  }

  try {
    await apiFetch(`/api/pacientes/${pacienteId}/atendimentos`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    toast('Atendimento registrado com sucesso!', 'success');
    $('form-atend').reset();
    const extrasEl = $('form-atend-extras');
    if (extrasEl) extrasEl.innerHTML = '';

    // Recarrega timeline
    state.currentTab = 'timeline';
    document.querySelectorAll('.tab-btn').forEach((b, i) => { if (i === 0) b.classList.add('active'); else b.classList.remove('active'); });
    loadTab('timeline', pacienteId);
  } catch (err) {
    toast(err.message, 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Registrar Prontuário';
  }
}

// ── LOG ──────────────────────────────────────────────────────
function renderLog(el, log) {
  if (!log.length) {
    el.innerHTML = '<div class="empty-state"><p>Nenhum acesso registrado.</p></div>';
    return;
  }
  el.innerHTML = `
    <table class="log-table">
      <thead><tr><th>Ação</th><th>Profissional</th><th>Perfil</th><th>Unidade</th><th>Data/Hora</th></tr></thead>
      <tbody>
        ${log.map(l => `
          <tr>
            <td><span class="log-acao">${esc(l.acao)}</span></td>
            <td>${esc(l.profissional)}</td>
            <td>${esc(l.role)}</td>
            <td>${esc(l.unidade)}</td>
            <td style="font-family:var(--mono);font-size:12px">${formatDateTime(l.timestamp)}</td>
          </tr>`).join('')}
      </tbody>
    </table>`;
}

// ── BOOTSTRAP ────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // Restaurar sessão
  const savedToken = localStorage.getItem('pnu_token');
  const savedUser  = localStorage.getItem('pnu_user');

  if (savedToken && savedUser) {
    state.token = savedToken;
    state.user  = JSON.parse(savedUser);
    initApp();
  } else {
    showScreen('login');
  }

  // Eventos
  $('login-form').addEventListener('submit', handleLogin);
  $('logout-btn').addEventListener('click', handleLogout);
  $('search-btn').addEventListener('click', handleSearch);

  $('search-input').addEventListener('keydown', e => {
    if (e.key === 'Enter') handleSearch();
  });

  // Nav
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
      const page = item.dataset.page;
      if (page === 'busca') setTopbar('Busca de Paciente', 'Pesquise por CNS, CPF ou nome');
      showPage(page);
    });
  });
});
