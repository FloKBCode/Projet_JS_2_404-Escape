// app.js — 404:ESCAPE
// 💻 Sarah — Séance 2 : IPC corrigé (window.api) + CRUD labyrinthes
// ====================================================================
// ⚠️  On utilise window.api.invoke() et NON ipcRenderer directement
//     car contextIsolation: true est activé dans main.js (Electron)
// ====================================================================

// ─────────────────────────────────────────────
// UTILITAIRES UI
// ─────────────────────────────────────────────

function showError(elementId, message) {
  const el = document.getElementById(elementId);
  if (el) { el.textContent = message; el.style.display = 'block'; }
}

function hideError(elementId) {
  const el = document.getElementById(elementId);
  if (el) { el.textContent = ''; el.style.display = 'none'; }
}

function showPage(pageId) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const target = document.getElementById(pageId);
  if (target) target.classList.add('active');
}

// ─────────────────────────────────────────────
// CONNEXION — BOUTON LOGIN
// ─────────────────────────────────────────────

const loginForm = document.getElementById('login-form');
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideError('login-error');

    const email    = document.getElementById('login-email')?.value.trim();
    const password = document.getElementById('login-password')?.value;

    if (!email || !password) {
      showError('login-error', 'Veuillez remplir tous les champs.');
      return;
    }

    try {
      const result = await window.api.invoke('auth:login', { email, password });
      if (result.success) {
        window.__token = result.token;
        await loadLabyrinthes();
        showPage('page-dashboard');
      } else {
        showError('login-error', result.message || 'Identifiants incorrects.');
      }
    } catch (err) {
      showError('login-error', 'Erreur de connexion. Réessaie.');
      console.error('❌ login error:', err);
    }
  });
}

// ─────────────────────────────────────────────
// INSCRIPTION — BOUTON REGISTER
// ─────────────────────────────────────────────

const registerForm = document.getElementById('register-form');
if (registerForm) {
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideError('register-error');

    const username = document.getElementById('register-username')?.value.trim();
    const email    = document.getElementById('register-email')?.value.trim();
    const password = document.getElementById('register-password')?.value;

    if (!username || !email || !password) {
      showError('register-error', 'Veuillez remplir tous les champs.');
      return;
    }

    try {
      const result = await window.api.invoke('auth:register', { username, email, password });
      if (result.success) {
        showPage('page-login');
      } else {
        showError('register-error', result.message || 'Erreur lors de l\'inscription.');
      }
    } catch (err) {
      showError('register-error', 'Erreur serveur. Réessaie.');
      console.error('❌ register error:', err);
    }
  });
}

// ─────────────────────────────────────────────
// CRUD LABYRINTHES
// ─────────────────────────────────────────────

/**
 * Charge et affiche les labyrinthes de l'utilisateur connecté.
 */
async function loadLabyrinthes() {
  try {
    const result = await window.api.invoke('labyrinth:getAll');
    if (result.success) {
      renderLabyrinthList(result.labyrinthes);
    }
  } catch (err) {
    console.error('❌ loadLabyrinthes error:', err);
  }
}

/**
 * Affiche la liste des labyrinthes dans le dashboard.
 */
function renderLabyrinthList(labyrinthes) {
  const container = document.getElementById('labyrinth-list');
  if (!container) return;

  container.innerHTML = '';

  if (labyrinthes.length === 0) {
    container.innerHTML = '<p class="empty">Aucun labyrinthe pour l\'instant.</p>';
    return;
  }

  labyrinthes.forEach(lab => {
    const div = document.createElement('div');
    div.classList.add('labyrinth-item');
    div.innerHTML = `
      <span>${lab.name} — ${lab.size} — Difficulté ${lab.difficulty}</span>
      <button class="btn-delete" data-id="${lab.id}">Supprimer</button>
    `;
    container.appendChild(div);
  });

  // Boutons supprimer
  container.querySelectorAll('.btn-delete').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = parseInt(btn.dataset.id);
      await deleteLabyrinth(id);
    });
  });
}

/**
 * Crée un nouveau labyrinthe.
 */
async function createLabyrinth(name, size, difficulty) {
  try {
    const result = await window.api.invoke('labyrinth:create', { name, size, difficulty });
    if (result.success) {
      await loadLabyrinthes();
    } else {
      console.error('❌ createLabyrinth:', result.message);
    }
  } catch (err) {
    console.error('❌ createLabyrinth error:', err);
  }
}

/**
 * Supprime un labyrinthe par son ID.
 */
async function deleteLabyrinth(id) {
  try {
    const result = await window.api.invoke('labyrinth:delete', { id });
    if (result.success) {
      await loadLabyrinthes();
    }
  } catch (err) {
    console.error('❌ deleteLabyrinth error:', err);
  }
}

// ─────────────────────────────────────────────
// MODALE CRÉATION LABYRINTHE
// ─────────────────────────────────────────────

const createForm = document.getElementById('create-labyrinth-form');
if (createForm) {
  createForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name       = document.getElementById('lab-name')?.value.trim();
    const size       = document.getElementById('lab-size')?.value;
    const difficulty = parseInt(document.getElementById('lab-difficulty')?.value);

    if (!name || !size || !difficulty) return;

    await createLabyrinth(name, size, difficulty);
    createForm.reset();
    document.getElementById('modal-create')?.classList.remove('active');
  });
}

// ─────────────────────────────────────────────
// NAVIGATION
// ─────────────────────────────────────────────

document.getElementById('go-to-register')?.addEventListener('click', (e) => {
  e.preventDefault();
  showPage('page-register');
});

document.getElementById('go-to-login')?.addEventListener('click', (e) => {
  e.preventDefault();
  showPage('page-login');
});

document.getElementById('btn-logout')?.addEventListener('click', () => {
  window.__token = null;
  showPage('page-login');
});

// ─────────────────────────────────────────────
// INIT
// ─────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  showPage('page-login');
});