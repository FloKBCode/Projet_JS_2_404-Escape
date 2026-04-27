// ============================================================
// renderer/app.js — Interactions front-end et appels IPC
// Responsable : Sarah
// ============================================================
// Ce fichier est le "cerveau" du côté interface graphique.
// Il s'exécute dans la fenêtre du navigateur Electron (renderer).
//
// SON RÔLE :
//   1. Écouter les clics, soumissions de formulaires, etc.
//   2. Envoyer des requêtes au back-end via window.api (IPC)
//   3. Recevoir les réponses et mettre à jour l'interface (DOM)
//
// COMMENT PARLER AU BACK-END ?
//   On utilise window.api.invoke('nom-du-canal', données)
//   C'est le preload.js qui expose cette fonction de façon sécurisée.
//   Exemple :
//     const result = await window.api.invoke('auth:login', { email, password })
//     if (result.success) { /* connexion réussie */ }
//
// ÉTAT DE L'APPLICATION :
//   On garde en mémoire l'utilisateur connecté et son token JWT.
//   Toutes les pages de l'app sont dans index.html,
//   on affiche/cache les sections selon l'état de connexion.
//
// IMPORTANT : ce fichier ne fait PAS de SQL, ne lit PAS de fichiers.
//   Tout ça c'est le rôle de database.js côté back.
// ============================================================

// app.js — 404:ESCAPE
// 💻 Sarah — Séance 1 : écouteurs d'événements de base (renderer process)
// =========================================================================
// Ce fichier tourne côté renderer (front). Il écoute les actions utilisateur
// et communique avec le main process via ipcRenderer (Electron).
// =========================================================================

const { ipcRenderer } = require('electron');

// ─────────────────────────────────────────────
// UTILITAIRES UI
// ─────────────────────────────────────────────

/**
 * Affiche un message d'erreur sous le formulaire.
 * @param {string} elementId — id de la div d'erreur
 * @param {string} message
 */
function showError(elementId, message) {
  const el = document.getElementById(elementId);
  if (el) {
    el.textContent = message;
    el.style.display = 'block';
  }
}

/**
 * Cache un message d'erreur.
 * @param {string} elementId
 */
function hideError(elementId) {
  const el = document.getElementById(elementId);
  if (el) {
    el.textContent = '';
    el.style.display = 'none';
  }
}

/**
 * Bascule entre les pages (login ↔ inscription ↔ dashboard).
 * @param {string} pageId — id de la section à afficher
 */
function showPage(pageId) {
  const pages = document.querySelectorAll('.page');
  pages.forEach(p => p.classList.remove('active'));
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
      // Envoi au main process via IPC
      const result = await ipcRenderer.invoke('auth:login', { email, password });

      if (result.success) {
        // Stocker le token JWT en mémoire (pas dans localStorage — Electron)
        window.__token = result.token;
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
      const result = await ipcRenderer.invoke('auth:register', { username, email, password });

      if (result.success) {
        // Rediriger vers le login après inscription réussie
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
// NAVIGATION — LIENS ENTRE PAGES
// ─────────────────────────────────────────────

// Lien "Pas encore de compte ? S'inscrire"
const goToRegister = document.getElementById('go-to-register');
if (goToRegister) {
  goToRegister.addEventListener('click', (e) => {
    e.preventDefault();
    showPage('page-register');
  });
}

// Lien "Déjà un compte ? Se connecter"
const goToLogin = document.getElementById('go-to-login');
if (goToLogin) {
  goToLogin.addEventListener('click', (e) => {
    e.preventDefault();
    showPage('page-login');
  });
}

// ─────────────────────────────────────────────
// DÉCONNEXION
// ─────────────────────────────────────────────

const logoutBtn = document.getElementById('btn-logout');
if (logoutBtn) {
  logoutBtn.addEventListener('click', () => {
    window.__token = null;
    showPage('page-login');
  });
}

// ─────────────────────────────────────────────
// INIT — Page affichée au démarrage
// ─────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  showPage('page-login');
});