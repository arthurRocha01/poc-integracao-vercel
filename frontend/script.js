/* ═══════════════════════════════════════════════════════════
   DATAHUB · CRUD SUPABASE — script.js
   ─────────────────────────────────────────────────────────
   ⚠️  CONFIGURAÇÃO: Preencha as constantes abaixo com suas
       credenciais do Supabase antes de usar.
   ═══════════════════════════════════════════════════════════ */

/* ── ⚙️  CONFIGURAÇÃO DO SUPABASE ─────────────────────────
   Acesse: https://app.supabase.com → projeto → Settings → API
   ──────────────────────────────────────────────────────── */
const SUPABASE_URL  = 'https://SEU_PROJETO.supabase.co';  // ← troque aqui
const SUPABASE_KEY  = 'sua-anon-key-aqui';                 // ← troque aqui

/* Tabela utilizada */
const TABLE_REGISTROS = 'registros'; // colunas: id, nome, email, senha, created_at

/* ═══════════════════════════════════════════════════════════
   HELPERS DE REQUISIÇÃO
   ═══════════════════════════════════════════════════════════ */
const headers = () => ({
  'apikey':        SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`,
  'Content-Type':  'application/json',
  'Prefer':        'return=representation',
});

async function supabaseFetch(path, method = 'GET', body = null) {
  const options = { method, headers: headers() };
  if (body) options.body = JSON.stringify(body);
  const response = await fetch(`${SUPABASE_URL}/rest/v1${path}`, options);
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || `Erro HTTP ${response.status}`);
  }
  if (response.status === 204) return null;
  return response.json();
}

/* ═══════════════════════════════════════════════════════════
   ESTADO GLOBAL
   ═══════════════════════════════════════════════════════════ */
let allRecords   = [];
let editingId    = null;
let deleteTarget = null;
let formVisible  = true;

/* ═══════════════════════════════════════════════════════════
   REFERÊNCIAS DOM
   ═══════════════════════════════════════════════════════════ */
const form           = document.getElementById('main-form');
const fieldId        = document.getElementById('field-id');
const fieldNome      = document.getElementById('field-nome');
const fieldEmail     = document.getElementById('field-email');
const fieldSenha     = document.getElementById('field-senha');
const fieldConfirma  = document.getElementById('field-confirma');
const btnSubmit      = document.getElementById('btn-submit');
const btnSubmitLabel = document.getElementById('btn-submit-label');
const btnLoader      = document.getElementById('btn-loader');
const btnCancelEdit  = document.getElementById('btn-cancel-edit');
const btnToggleForm  = document.getElementById('btn-toggle-form');
const formTitle      = document.getElementById('form-title');
const formPanel      = document.getElementById('form-panel');

const tableBody      = document.getElementById('table-body');
const tableLoader    = document.getElementById('table-loader');
const tableEmpty     = document.getElementById('table-empty');
const tableWrapper   = document.getElementById('table-wrapper');
const searchInput    = document.getElementById('search-input');
const btnRefresh     = document.getElementById('btn-refresh');
const recordCount    = document.getElementById('record-count');
const connStatus     = document.getElementById('connection-status');

const modalOverlay   = document.getElementById('modal-overlay');
const btnConfirmDel  = document.getElementById('btn-confirm-delete');
const btnCancelDel   = document.getElementById('btn-cancel-delete');
const toast          = document.getElementById('toast');

/* ═══════════════════════════════════════════════════════════
   MOSTRAR / OCULTAR SENHA
   ═══════════════════════════════════════════════════════════ */
function setupToggle(btnId, inputEl, eyeId) {
  const btn = document.getElementById(btnId);
  const eye = document.getElementById(eyeId);
  if (!btn) return;
  btn.addEventListener('click', () => {
    const hidden = inputEl.type === 'password';
    inputEl.type = hidden ? 'text' : 'password';
    eye.className = hidden ? 'ph ph-eye-slash' : 'ph ph-eye';
  });
}
setupToggle('toggle-senha',    fieldSenha,    'eye-senha');
setupToggle('toggle-confirma', fieldConfirma, 'eye-confirma');

/* ═══════════════════════════════════════════════════════════
   FORÇA DA SENHA — barra visual
   ═══════════════════════════════════════════════════════════ */
function buildStrengthMeter() {
  const group = fieldSenha.closest('.form-group');
  const bar   = document.createElement('div');
  bar.className = 'strength-bar';
  const fill = document.createElement('div');
  fill.className = 'strength-fill';
  fill.id = 'strength-fill';
  bar.appendChild(fill);
  const label = document.createElement('div');
  label.className = 'strength-label';
  label.id = 'strength-label';
  group.appendChild(bar);
  group.appendChild(label);
}

function calcStrength(pwd) {
  let s = 0;
  if (pwd.length >= 6)          s++;
  if (pwd.length >= 10)         s++;
  if (/[A-Z]/.test(pwd))        s++;
  if (/[0-9]/.test(pwd))        s++;
  if (/[^A-Za-z0-9]/.test(pwd)) s++;
  return s;
}

function updateStrengthUI(pwd) {
  const fill  = document.getElementById('strength-fill');
  const label = document.getElementById('strength-label');
  if (!fill || !label) return;
  if (!pwd) { fill.style.width = '0%'; label.textContent = ''; return; }
  const levels = [
    { pct: '15%',  color: '#ff4d6d', text: 'Muito fraca' },
    { pct: '30%',  color: '#ff7f50', text: 'Fraca'       },
    { pct: '55%',  color: '#ffb340', text: 'Razoável'    },
    { pct: '80%',  color: '#4f9cf9', text: 'Boa'         },
    { pct: '100%', color: '#00e5b0', text: 'Forte'       },
  ];
  const lvl = levels[Math.min(calcStrength(pwd), 4)];
  fill.style.width      = lvl.pct;
  fill.style.background = lvl.color;
  label.textContent     = lvl.text;
  label.style.color     = lvl.color;
}

fieldSenha.addEventListener('input', () => updateStrengthUI(fieldSenha.value));

/* ═══════════════════════════════════════════════════════════
   TOAST
   ═══════════════════════════════════════════════════════════ */
let toastTimer = null;
function showToast(message, type = 'info') {
  clearTimeout(toastTimer);
  const icons = { success: 'ph-check-circle', error: 'ph-x-circle', info: 'ph-info' };
  toast.innerHTML = `<i class="ph ${icons[type]}"></i> ${message}`;
  toast.className = `toast ${type} show`;
  toastTimer = setTimeout(() => toast.classList.remove('show'), 3500);
}

/* ═══════════════════════════════════════════════════════════
   STATUS DA CONEXÃO
   ═══════════════════════════════════════════════════════════ */
function setConnectionStatus(online) {
  connStatus.className = `conn-status ${online ? 'online' : 'offline'}`;
  connStatus.querySelector('.conn-label').textContent = online ? 'online' : 'offline';
}

/* ═══════════════════════════════════════════════════════════
   LOADER DO BOTÃO
   ═══════════════════════════════════════════════════════════ */
function setSubmitLoading(loading) {
  btnSubmit.disabled = loading;
  btnLoader.classList.toggle('hidden', !loading);
  btnSubmitLabel.textContent = loading ? 'Aguarde…' : (editingId ? 'Atualizar' : 'Salvar');
}

/* ═══════════════════════════════════════════════════════════
   VALIDAÇÃO
   ═══════════════════════════════════════════════════════════ */
function clearErrors() {
  ['err-nome','err-email','err-senha','err-confirma'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = '';
  });
}
function showError(key, msg) {
  const el = document.getElementById(`err-${key}`);
  if (el) el.textContent = msg;
}

function validateForm() {
  clearErrors();
  let valid = true;

  const nome = fieldNome.value.trim();
  if (!nome)           { showError('nome',  'O nome é obrigatório.');   valid = false; }
  else if (nome.length < 2) { showError('nome', 'Mínimo 2 caracteres.'); valid = false; }

  const email = fieldEmail.value.trim();
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email)             { showError('email', 'O e-mail é obrigatório.');    valid = false; }
  else if (!emailRe.test(email)) { showError('email', 'Formato inválido.'); valid = false; }

  const senha    = fieldSenha.value;
  const confirma = fieldConfirma.value;

  if (!editingId) {
    // CREATE — senha obrigatória
    if (!senha)           { showError('senha',    'A senha é obrigatória.');      valid = false; }
    else if (senha.length < 6) { showError('senha', 'Mínimo 6 caracteres.');      valid = false; }
    else if (senha !== confirma) { showError('confirma', 'As senhas não coincidem.'); valid = false; }
  } else {
    // EDIT — senha opcional; valida só se preenchida
    if (senha) {
      if (senha.length < 6)      { showError('senha',    'Mínimo 6 caracteres.');      valid = false; }
      else if (senha !== confirma) { showError('confirma', 'As senhas não coincidem.'); valid = false; }
    }
  }

  return valid;
}

/* ═══════════════════════════════════════════════════════════
   TABELA — renderização
   ═══════════════════════════════════════════════════════════ */
function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR') + ' ' +
         d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function renderTable(records) {
  tableBody.innerHTML = '';
  if (!records || records.length === 0) {
    tableLoader.classList.add('hidden');
    tableWrapper.classList.add('hidden');
    tableEmpty.classList.remove('hidden');
    return;
  }
  tableLoader.classList.add('hidden');
  tableEmpty.classList.add('hidden');
  tableWrapper.classList.remove('hidden');

  records.forEach((rec, index) => {
    const tr = document.createElement('tr');
    tr.style.animationDelay = `${index * 30}ms`;
    tr.innerHTML = `
      <td class="row-index">${index + 1}</td>
      <td>${escapeHtml(rec.nome)}</td>
      <td>${escapeHtml(rec.email)}</td>
      <td><span class="pwd-mask">••••••••</span></td>
      <td class="row-date">${formatDate(rec.created_at)}</td>
      <td class="col-actions">
        <div class="row-actions">
          <button class="btn btn-ghost btn-edit" data-id="${rec.id}" title="Editar">
            <i class="ph ph-pencil-simple"></i>
          </button>
          <button class="btn btn-ghost btn-del" data-id="${rec.id}" title="Excluir">
            <i class="ph ph-trash"></i>
          </button>
        </div>
      </td>`;
    tableBody.appendChild(tr);
  });

  tableBody.querySelectorAll('.btn-edit').forEach(btn =>
    btn.addEventListener('click', () => startEdit(btn.dataset.id)));
  tableBody.querySelectorAll('.btn-del').forEach(btn =>
    btn.addEventListener('click', () => confirmDelete(btn.dataset.id)));
}

/* ═══════════════════════════════════════════════════════════
   FILTRO (client-side)
   ═══════════════════════════════════════════════════════════ */
function applyFilter() {
  const q = searchInput.value.toLowerCase().trim();
  renderTable(q
    ? allRecords.filter(r =>
        r.nome.toLowerCase().includes(q) || r.email.toLowerCase().includes(q))
    : allRecords);
}

/* ═══════════════════════════════════════════════════════════
   CRUD — READ
   ═══════════════════════════════════════════════════════════ */
async function loadRecords() {
  tableLoader.classList.remove('hidden');
  tableWrapper.classList.add('hidden');
  tableEmpty.classList.add('hidden');
  try {
    // Nunca retorne a senha em texto puro — selecione só os campos necessários
    const data = await supabaseFetch(
      `/${TABLE_REGISTROS}?select=id,nome,email,created_at&order=created_at.desc`
    );
    allRecords = data || [];
    recordCount.textContent = `${allRecords.length} registro${allRecords.length !== 1 ? 's' : ''}`;
    setConnectionStatus(true);
    renderTable(allRecords);
  } catch (err) {
    console.error('Erro ao carregar:', err);
    setConnectionStatus(false);
    showToast('Falha ao buscar registros. Verifique a conexão.', 'error');
    tableLoader.classList.add('hidden');
    tableEmpty.classList.remove('hidden');
  }
}

/* ═══════════════════════════════════════════════════════════
   CRUD — CREATE / UPDATE / DELETE
   ═══════════════════════════════════════════════════════════ */
const createRecord = (p) => supabaseFetch(`/${TABLE_REGISTROS}`, 'POST', p);
const updateRecord = (id, p) => supabaseFetch(`/${TABLE_REGISTROS}?id=eq.${id}`, 'PATCH', p);
const deleteRecord = (id) => supabaseFetch(`/${TABLE_REGISTROS}?id=eq.${id}`, 'DELETE');

/* ═══════════════════════════════════════════════════════════
   FORMULÁRIO — submissão
   ═══════════════════════════════════════════════════════════ */
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!validateForm()) return;
  setSubmitLoading(true);

  const payload = { nome: fieldNome.value.trim(), email: fieldEmail.value.trim() };
  const senha = fieldSenha.value;
  // ⚠️ Em produção, use Supabase Auth ou hash no backend; não armazene senhas em texto puro.
  if (senha) payload.senha = senha;

  try {
    if (editingId) {
      await updateRecord(editingId, payload);
      showToast('Registro atualizado!', 'success');
      cancelEdit();
    } else {
      await createRecord(payload);
      showToast('Registro criado!', 'success');
      resetForm();
    }
    await loadRecords();
  } catch (err) {
    showToast(`Erro ao salvar: ${err.message}`, 'error');
  } finally {
    setSubmitLoading(false);
  }
});

/* ═══════════════════════════════════════════════════════════
   EDIÇÃO
   ═══════════════════════════════════════════════════════════ */
function startEdit(id) {
  const rec = allRecords.find(r => r.id === id);
  if (!rec) return;
  editingId          = id;
  fieldId.value      = rec.id;
  fieldNome.value    = rec.nome;
  fieldEmail.value   = rec.email;
  fieldSenha.value   = '';
  fieldConfirma.value = '';

  formTitle.innerHTML = '<i class="ph ph-pencil-simple"></i> Editando Registro';
  btnSubmitLabel.textContent = 'Atualizar';
  btnCancelEdit.classList.remove('hidden');

  // Informa que senha é opcional na edição
  const senhaLabel = fieldSenha.closest('.form-group').querySelector('label');
  senhaLabel.innerHTML = 'Nova Senha <small style="color:var(--text-dim);font-size:.7rem;text-transform:none;">(opcional — deixe vazio para não alterar)</small>';

  updateStrengthUI('');
  showForm();
  formPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
  fieldNome.focus();
}

function cancelEdit() {
  editingId = null;
  const senhaLabel = fieldSenha.closest('.form-group').querySelector('label');
  senhaLabel.innerHTML = 'Senha <span class="required">*</span>';
  resetForm();
  formTitle.innerHTML = '<i class="ph ph-plus-circle"></i> Novo Registro';
  btnSubmitLabel.textContent = 'Salvar';
  btnCancelEdit.classList.add('hidden');
}

function resetForm() {
  form.reset();
  fieldId.value = '';
  clearErrors();
  updateStrengthUI('');
}

btnCancelEdit.addEventListener('click', cancelEdit);

/* ═══════════════════════════════════════════════════════════
   EXCLUSÃO
   ═══════════════════════════════════════════════════════════ */
function confirmDelete(id) { deleteTarget = id; modalOverlay.classList.remove('hidden'); }

btnCancelDel.addEventListener('click', () => {
  deleteTarget = null;
  modalOverlay.classList.add('hidden');
});

btnConfirmDel.addEventListener('click', async () => {
  if (!deleteTarget) return;
  modalOverlay.classList.add('hidden');
  try {
    await deleteRecord(deleteTarget);
    showToast('Registro excluído.', 'success');
    await loadRecords();
  } catch (err) {
    showToast(`Erro ao excluir: ${err.message}`, 'error');
  } finally { deleteTarget = null; }
});

modalOverlay.addEventListener('click', (e) => {
  if (e.target === modalOverlay) { deleteTarget = null; modalOverlay.classList.add('hidden'); }
});

/* ═══════════════════════════════════════════════════════════
   TOGGLE FORMULÁRIO / BUSCA / REFRESH
   ═══════════════════════════════════════════════════════════ */
function showForm() {
  formVisible = true;
  form.classList.remove('hidden');
  btnToggleForm.querySelector('i').className = 'ph ph-caret-up';
}

btnToggleForm.addEventListener('click', () => {
  formVisible = !formVisible;
  form.classList.toggle('hidden', !formVisible);
  btnToggleForm.querySelector('i').className = formVisible ? 'ph ph-caret-up' : 'ph ph-caret-down';
});

searchInput.addEventListener('input', applyFilter);

btnRefresh.addEventListener('click', async () => {
  btnRefresh.querySelector('i').style.animation = 'spin .5s linear';
  await loadRecords();
  setTimeout(() => { btnRefresh.querySelector('i').style.animation = ''; }, 500);
});

/* ═══════════════════════════════════════════════════════════
   INICIALIZAÇÃO
   ═══════════════════════════════════════════════════════════ */
async function init() {
  buildStrengthMeter();
  await loadRecords();
}

document.addEventListener('DOMContentLoaded', init);