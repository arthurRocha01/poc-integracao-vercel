/* ═══════════════════════════════════════════════════════════
   CONFIGURAÇÃO E API
   ═══════════════════════════════════════════════════════════ */
const API_URL = '/api';

async function apiFetch(path, method = 'GET', body = null) {
  const options = {
    method,
    headers: { 'Content-Type': 'application/json' }
  };

  if (body) options.body = JSON.stringify(body);

  const response = await fetch(`${API_URL}${path}`, options);

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || `HTTP Error ${response.status}`);
  }

  return response.json();
}

/* ═══════════════════════════════════════════════════════════
   ESTADO E MAPEAMENTO DO DOM
   ═══════════════════════════════════════════════════════════ */
let allRecords = [];

// Formulário e Campos
const form = document.getElementById('main-form');
const btnSubmit = document.getElementById('btn-submit');
const btnLoader = document.getElementById('btn-loader');
const btnLabel = document.getElementById('btn-submit-label');

const fieldName = document.getElementById('field-nome');
const fieldEmail = document.getElementById('field-email');
const fieldPassword = document.getElementById('field-senha');
const fieldConfirmPassword = document.getElementById('field-confirm-password');

// Tabela e Estados de Carregamento
const tableBody = document.getElementById('table-body');
const tableLoader = document.getElementById('table-loader');
const tableEmpty = document.getElementById('table-empty');
const tableWrapper = document.getElementById('table-wrapper');

// UI Geral
const searchInput = document.getElementById('search-input');
const btnRefresh = document.getElementById('btn-refresh');
const toast = document.getElementById('toast');
const recordCountBadge = document.getElementById('record-count');
const connStatus = document.getElementById('connection-status');

/* ═══════════════════════════════════════════════════════════
   UTILITÁRIOS
   ═══════════════════════════════════════════════════════════ */
function showToast(message, type = 'info') {
  toast.textContent = message;
  toast.className = `toast show ${type}`;
  setTimeout(() => toast.classList.remove('show'), 3000);
}

// Alternar visibilidade da senha
function setupPasswordToggle(buttonId, inputId, iconId) {
  const btn = document.getElementById(buttonId);
  const input = document.getElementById(inputId);
  const icon = document.getElementById(iconId);

  btn.addEventListener('click', () => {
    const isPwd = input.type === 'password';
    input.type = isPwd ? 'text' : 'password';
    icon.className = isPwd ? 'ph ph-eye-slash' : 'ph ph-eye';
  });
}

setupPasswordToggle('toggle-senha', 'field-senha', 'eye-senha');
setupPasswordToggle('toggle-confirma', 'field-confirm-password', 'eye-confirma');

/* ═══════════════════════════════════════════════════════════
   LÓGICA DE DADOS (CRUD)
   ═══════════════════════════════════════════════════════════ */

async function loadRecords() {
  // Mostra loader e esconde tabela/vazio
  tableLoader.classList.remove('hidden');
  tableWrapper.classList.add('hidden');
  tableEmpty.classList.add('hidden');

  try {
    const data = await apiFetch('/users');
    allRecords = data.data || data;

    // Atualiza status para online
    connStatus.classList.replace('offline', 'online');
    connStatus.querySelector('.conn-label').textContent = 'online';

    renderTable(allRecords);
  } catch (err) {
    console.error(err);
    showToast('Erro ao conectar com a API', 'error');
    
    // Em caso de erro, remove loader e marca offline
    tableLoader.classList.add('hidden');
    connStatus.classList.replace('online', 'offline');
    connStatus.querySelector('.conn-label').textContent = 'offline';
  }
}

function renderTable(records) {
  tableBody.innerHTML = '';
  tableLoader.classList.add('hidden'); // Esconde o loader infinito

  // Atualiza badge de contagem
  recordCountBadge.textContent = `${records.length} registro(s)`;

  if (records.length === 0) {
    tableWrapper.classList.add('hidden');
    tableEmpty.classList.remove('hidden');
    return;
  }

  tableWrapper.classList.remove('hidden');
  tableEmpty.classList.add('hidden');

  records.forEach(user => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${user.name}</td>
      <td>${user.email}</td>
      <td class="pwd-mask">••••••</td> 
      <td class="row-date">${new Date(user.created_at).toLocaleDateString('pt-BR')}</td>
    `;
    tableBody.appendChild(tr);
  });
}

/* ═══════════════════════════════════════════════════════════
   EVENTOS
   ═══════════════════════════════════════════════════════════ */

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const name = fieldName.value.trim();
  const email = fieldEmail.value.trim();
  const password = fieldPassword.value;
  const confirmPassword = fieldConfirmPassword.value;

  if (!name || !email || !password) {
    return showToast('Preencha todos os campos obrigatórios', 'error');
  }

  if (password !== confirmPassword) {
    return showToast('As senhas não coincidem', 'error');
  }

  // Feedback visual no botão
  btnSubmit.disabled = true;
  btnLoader.classList.remove('hidden');
  btnLabel.textContent = 'Salvando...';

  try {
    await apiFetch('/users', 'POST', { name, email, password });
    showToast('Usuário criado com sucesso!', 'success');
    
    form.reset();
    await loadRecords();
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    btnSubmit.disabled = false;
    btnLoader.classList.add('hidden');
    btnLabel.textContent = 'Salvar';
  }
});

// Busca em tempo real
searchInput.addEventListener('input', () => {
  const q = searchInput.value.toLowerCase();
  const filtered = allRecords.filter(u =>
    u.name.toLowerCase().includes(q) ||
    u.email.toLowerCase().includes(q)
  );
  renderTable(filtered);
});

// Botão de atualizar manual
btnRefresh.addEventListener('click', loadRecords);

// Inicialização
loadRecords();