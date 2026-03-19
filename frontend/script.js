/* ═══════════════════════════════════════════════════════════
   API E FETCH
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
   ESTADO E DOM
   ═══════════════════════════════════════════════════════════ */
let allRecords = [];

const form = document.getElementById('main-form');
const fieldName = document.getElementById('field-nome');
const fieldEmail = document.getElementById('field-email');
const fieldPassword = document.getElementById('field-senha');
const fieldConfirmPassword = document.getElementById('field-confirm-password');

const tableBody = document.getElementById('table-body');
const searchInput = document.getElementById('search-input');
const btnRefresh = document.getElementById('btn-refresh');
const toast = document.getElementById('toast');

/* ═══════════════════════════════════════════════════════════
   UTILITÁRIOS
   ═══════════════════════════════════════════════════════════ */
function showToast(message, type = 'info') {
  toast.textContent = message;
  toast.className = `toast show ${type}`;
  setTimeout(() => toast.classList.remove('show'), 3000);
}

const createRecord = (data) => apiFetch('/users', 'POST', data);

/* ═══════════════════════════════════════════════════════════
   CARREGAR E RENDERIZAR TABELA
   ═══════════════════════════════════════════════════════════ */
async function loadRecords() {
  try {
    const data = await apiFetch('/users');
    allRecords = data.data || data;
    renderTable(allRecords);
  } catch (err) {
    console.error(err);
    showToast('Erro ao carregar usuários', 'error');
  }
}

function renderTable(records) {
  tableBody.innerHTML = '';

  if (!records.length) {
    tableBody.innerHTML = `<tr><td colspan="4" style="text-align: center;">Nenhum registro encontrado</td></tr>`;
    return;
  }

  records.forEach(user => {
    const tr = document.createElement('tr');

    // Note que adicionei uma coluna de "******" para a senha, 
    // já que no seu HTML tem uma coluna <th>Senha</th>.
    tr.innerHTML = `
      <td>${user.name}</td>
      <td>${user.email}</td>
      <td>******</td> 
      <td>${new Date(user.created_at).toLocaleDateString('pt-BR')}</td>
    `;

    tableBody.appendChild(tr);
  });
}

/* ═══════════════════════════════════════════════════════════
   EVENTOS
   ═══════════════════════════════════════════════════════════ */
// Envio do Formulário (Apenas Criar)
form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const name = fieldName.value.trim();
  const email = fieldEmail.value.trim();
  const password = fieldPassword.value;
  const confirmPassword = fieldConfirmPassword.value;

  if (password && password !== confirmPassword) {
    return showToast('As senhas não coincidem', 'error');
  }

  const payload = { name, email };
  if (password) payload.password = password;

  try {
    await createRecord(payload);
    showToast('Usuário criado com sucesso!', 'success');
    
    form.reset();
    await loadRecords();
  } catch (err) {
    showToast(err.message, 'error');
  }
});

// Busca/Filtro
searchInput.addEventListener('input', () => {
  const q = searchInput.value.toLowerCase();
  const filtered = allRecords.filter(u =>
    u.name.toLowerCase().includes(q) ||
    u.email.toLowerCase().includes(q)
  );
  renderTable(filtered);
});

// Atualizar Tabela
btnRefresh.addEventListener('click', loadRecords);

// Inicialização
loadRecords();