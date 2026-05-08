const API = 'http://localhost:3000';
let editandoId = null;
let toastTimer;
let paginaAtual = 1;
const LIMITE = 10;

async function carregarUsuarios(pagina = paginaAtual) {
  paginaAtual = pagina;
  const corpo = document.getElementById('corpo');
  document.querySelectorAll('.btn-page').forEach(b => b.disabled = true);
  corpo.innerHTML = '<tr><td colspan="4"><div class="loading-row"><span class="spinner"></span> Carregando...</div></td></tr>';

  try {
    const res = await fetch(`${API}/users?page=${pagina}&limit=${LIMITE}`);
    const { users, total, totalPages } = await res.json();

    corpo.innerHTML = '';

    if (!users.length) {
      if (paginaAtual > 1) { carregarUsuarios(paginaAtual - 1); return; }
      corpo.innerHTML = '<tr><td colspan="4"><div class="empty-state">Nenhum usuário cadastrado.</div></td></tr>';
      renderPaginacao(0, 0, 0);
      return;
    }

    users.forEach(user => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${user.id}</td>
        <td>${escHtml(user.name)}</td>
        <td>${escHtml(user.email)}</td>
        <td>
          <div class="actions">
            <button class="btn-warning" onclick="abrirModal(${user.id}, '${escAttr(user.name)}', '${escAttr(user.email)}')">Editar</button>
            <button class="btn-danger" onclick="deletarUsuario(${user.id}, this)">Apagar</button>
          </div>
        </td>`;
      corpo.appendChild(tr);
    });

    renderPaginacao(pagina, totalPages, total);
  } catch {
    corpo.innerHTML = '';
    toast('Erro ao carregar usuários.', 'error');
    document.querySelectorAll('.btn-page').forEach(b => b.disabled = false);
  }
}

function renderPaginacao(pagina, totalPages, total) {
  const el   = document.getElementById('paginacao');
  const info = document.getElementById('info-paginacao');
  el.innerHTML = '';

  if (total > 0) {
    const inicio = (pagina - 1) * LIMITE + 1;
    const fim    = Math.min(pagina * LIMITE, total);
    info.textContent = `Mostrando ${inicio}–${fim} de ${total} usuário${total !== 1 ? 's' : ''}`;
  } else {
    info.textContent = '';
  }

  if (totalPages <= 1) return;

  function addBtn(label, page, active, disabled) {
    const btn = document.createElement('button');
    btn.textContent = label;
    btn.className   = 'btn-page' + (active ? ' active' : '');
    btn.disabled    = disabled;
    if (!disabled && !active) btn.onclick = () => carregarUsuarios(page);
    el.appendChild(btn);
  }

  function addEllipsis() {
    const span = document.createElement('span');
    span.textContent = '…';
    span.className   = 'pg-ellipsis';
    el.appendChild(span);
  }

  addBtn('‹', pagina - 1, false, pagina === 1);

  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) addBtn(i, i, i === pagina, false);
  } else {
    addBtn(1, 1, pagina === 1, false);
    if (pagina > 3) addEllipsis();
    const start = Math.max(2, pagina - 1);
    const end   = Math.min(totalPages - 1, pagina + 1);
    for (let i = start; i <= end; i++) addBtn(i, i, i === pagina, false);
    if (pagina < totalPages - 2) addEllipsis();
    addBtn(totalPages, totalPages, pagina === totalPages, false);
  }

  addBtn('›', pagina + 1, false, pagina === totalPages);
}

function setLoading(btn, loading, textoOriginal = '', textoLoading = 'Aguarde...') {
  if (loading) {
    btn.disabled             = true;
    btn.dataset.originalText = btn.textContent;
    btn.innerHTML            = `<span class="spinner"></span> ${textoLoading}`;
  } else {
    btn.disabled    = false;
    btn.textContent = btn.dataset.originalText || textoOriginal;
  }
}

async function criarUsuario() {
  const nameEl  = document.getElementById('name');
  const emailEl = document.getElementById('email');
  if (!nameEl.reportValidity() || !emailEl.reportValidity()) return;
  const name  = nameEl.value.trim();
  const email = emailEl.value.trim();

  const btn = document.getElementById('btn-adicionar');
  setLoading(btn, true, 'Adicionar', 'Adicionando...');

  try {
    const res = await fetch(`${API}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email })
    });
    if (!res.ok) throw new Error();
    document.getElementById('name').value  = '';
    document.getElementById('email').value = '';
    toast('Usuário criado com sucesso!', 'success');
    carregarUsuarios(1);
  } catch {
    toast('Erro ao criar usuário.', 'error');
  } finally {
    setLoading(btn, false, 'Adicionar');
  }
}

async function deletarUsuario(id, btn) {
  if (!confirm('Tem certeza que deseja apagar este usuário?')) return;
  setLoading(btn, true, 'Apagar', 'Apagando...');
  try {
    const res = await fetch(`${API}/users/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error();
    toast('Usuário apagado.', 'success');
    carregarUsuarios(paginaAtual);
  } catch {
    setLoading(btn, false, 'Apagar');
    toast('Erro ao apagar usuário.', 'error');
  }
}

function abrirModal(id, name, email) {
  editandoId = id;
  document.getElementById('edit-name').value  = name;
  document.getElementById('edit-email').value = email;
  document.getElementById('modal').classList.add('open');
}

function fecharModal() {
  editandoId = null;
  document.getElementById('modal').classList.remove('open');
}

async function salvarEdicao() {
  const nameEl  = document.getElementById('edit-name');
  const emailEl = document.getElementById('edit-email');
  if (!nameEl.reportValidity() || !emailEl.reportValidity()) return;
  const name  = nameEl.value.trim();
  const email = emailEl.value.trim();

  const btn = document.getElementById('btn-salvar');
  setLoading(btn, true, 'Salvar', 'Salvando...');

  try {
    const res = await fetch(`${API}/users/${editandoId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email })
    });
    if (!res.ok) throw new Error();
    fecharModal();
    toast('Usuário atualizado!', 'success');
    carregarUsuarios();
  } catch {
    toast('Erro ao atualizar usuário.', 'error');
  } finally {
    setLoading(btn, false, 'Salvar');
  }
}

function toast(msg, type) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className = `show ${type}`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 3000);
}

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escAttr(str) {
  return String(str).replace(/'/g, "\\'");
}

document.getElementById('modal').addEventListener('click', e => {
  if (e.target === e.currentTarget) fecharModal();
});

carregarUsuarios();
