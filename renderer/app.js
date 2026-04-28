// app.js — 404:ESCAPE
// Réécrit pour correspondre exactement à index.html
// ====================================================
// Utilise window.api.invoke() (contextIsolation: true)
// ====================================================

// ─────────────────────────────────────────────────────
// ÉTAT GLOBAL
// ─────────────────────────────────────────────────────
let currentUser     = null   // { id, username, email, role }
let currentToken    = null   // token JWT
let currentGrid     = null   // grille du labyrinthe affiché
let selectedSize    = 'small' // taille sélectionnée sur la page labyrinthe

// ─────────────────────────────────────────────────────
// NAVIGATION — goToPage()
// Appelée depuis le HTML : onclick="goToPage('dashboard')"
// ─────────────────────────────────────────────────────
function goToPage(name) {
  document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'))
  const target = document.getElementById('page-' + name)
  if (target) target.classList.remove('hidden')

  // Actions au changement de page
  if (name === 'dashboard') loadLabyrinthes()
  if (name === 'admin')     initAdminPage()
}

// ─────────────────────────────────────────────────────
// ONGLETS LOGIN / INSCRIPTION — switchTab()
// Appelée depuis le HTML : onclick="switchTab('login')"
// ─────────────────────────────────────────────────────
function switchTab(tab) {
  const formLogin    = document.getElementById('form-login')
  const formRegister = document.getElementById('form-register')
  const tabLogin     = document.getElementById('tab-login')
  const tabRegister  = document.getElementById('tab-register')

  if (tab === 'login') {
    formLogin.classList.remove('hidden')
    formRegister.classList.add('hidden')
    tabLogin.classList.add('active')
    tabRegister.classList.remove('active')
  } else {
    formRegister.classList.remove('hidden')
    formLogin.classList.add('hidden')
    tabRegister.classList.add('active')
    tabLogin.classList.remove('active')
  }
}

// ─────────────────────────────────────────────────────
// CONNEXION — handleLogin()
// Appelée depuis le HTML : onsubmit="handleLogin(event)"
// ─────────────────────────────────────────────────────
async function handleLogin(event) {
  event.preventDefault()

  const errorEl = document.getElementById('login-error')
  errorEl.hidden = true

  const email    = document.getElementById('login-email').value.trim()
  const password = document.getElementById('login-password').value

  if (!email || !password) {
    errorEl.textContent = 'Veuillez remplir tous les champs.'
    errorEl.hidden = false
    return
  }

  try {
    const result = await window.api.invoke('auth:login', { email, password })

    if (result.success) {
      currentUser  = result.user
      currentToken = result.token

      // Met à jour le header du dashboard
      const greeting = document.getElementById('user-greeting')
      if (greeting) greeting.textContent = '> ' + result.user.username.toUpperCase()

      // Affiche le bouton admin si c'est un admin
      const btnAdmin = document.getElementById('btn-admin')
      if (btnAdmin && result.user.role === 'admin') btnAdmin.hidden = false

      goToPage('dashboard')

    } else {
      errorEl.textContent = result.message || 'Email ou mot de passe incorrect.'
      errorEl.hidden = false
    }

  } catch (err) {
    errorEl.textContent = 'Erreur de connexion. Réessaie.'
    errorEl.hidden = false
    console.error('[login]', err)
  }
}

// ─────────────────────────────────────────────────────
// INSCRIPTION — handleRegister()
// Appelée depuis le HTML : onsubmit="handleRegister(event)"
// ─────────────────────────────────────────────────────
async function handleRegister(event) {
  event.preventDefault()

  const errorEl = document.getElementById('reg-error')
  errorEl.hidden = true

  const username = document.getElementById('reg-username').value.trim()
  const email    = document.getElementById('reg-email').value.trim()
  const password = document.getElementById('reg-password').value

  if (!username || !email || !password) {
    errorEl.textContent = 'Veuillez remplir tous les champs.'
    errorEl.hidden = false
    return
  }

  try {
    const result = await window.api.invoke('auth:register', { username, email, password })

    if (result.success) {
      currentUser  = result.user
      currentToken = result.token

      // Connexion automatique après inscription
      const greeting = document.getElementById('user-greeting')
      if (greeting) greeting.textContent = '> ' + result.user.username.toUpperCase()

      showToast('Bienvenue ' + username + ' !')
      goToPage('dashboard')

    } else {
      errorEl.textContent = result.message || 'Erreur lors de l\'inscription.'
      errorEl.hidden = false
    }

  } catch (err) {
    errorEl.textContent = 'Erreur serveur. Réessaie.'
    errorEl.hidden = false
    console.error('[register]', err)
  }
}

// ─────────────────────────────────────────────────────
// DÉCONNEXION — logout()
// Appelée depuis le HTML : onclick="logout()"
// ─────────────────────────────────────────────────────
function logout() {
  currentUser  = null
  currentToken = null
  currentGrid  = null

  // Reset le bouton admin
  const btnAdmin = document.getElementById('btn-admin')
  if (btnAdmin) btnAdmin.hidden = true

  // Retour à la page login sur l'onglet connexion
  switchTab('login')
  goToPage('login')
}

// ─────────────────────────────────────────────────────
// DASHBOARD — chargement des labyrinthes
// ─────────────────────────────────────────────────────
async function loadLabyrinthes() {
  if (!currentUser) return

  try {
    const result = await window.api.invoke('lab:getAll', currentUser.id)
    const container = document.getElementById('labyrinth-list')
    if (!container) return

    if (!result.success || result.labyrinthes.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <p>AUCUN LABYRINTHE</p>
          <p class="empty-sub">Cree ton premier !</p>
        </div>`
      return
    }

    const sizes = { small: 'PETIT', medium: 'MOYEN', large: 'GRAND' }

    container.innerHTML = result.labyrinthes.map(lab => `
      <div class="lab-card">
        <div class="lab-card-header">
          <span class="lab-name">${escapeHtml(lab.name)}</span>
          <span class="lab-diff">LVL ${lab.difficulty}</span>
        </div>
        <div class="lab-card-meta">${sizes[lab.size] || lab.size}</div>
        <div class="lab-card-actions">
          <button class="btn-icon small" onclick="openLabyrinth(${lab.id})">JOUER</button>
          <button class="btn-icon small danger" onclick="deleteLabyrinth(${lab.id}, '${escapeHtml(lab.name)}')">SUPPR.</button>
        </div>
      </div>
    `).join('')

  } catch (err) {
    console.error('[loadLabyrinthes]', err)
  }
}

// Ouvre un labyrinthe existant
async function openLabyrinth(id) {
  try {
    const result = await window.api.invoke('lab:getById', id)
    if (result.success && result.lab) {
      currentGrid = JSON.parse(result.lab.data)
      const titleEl = document.getElementById('lab-page-title')
      if (titleEl) titleEl.textContent = result.lab.name.toUpperCase()
      drawMaze(currentGrid)
      goToPage('labyrinth')
    }
  } catch (err) {
    console.error('[openLabyrinth]', err)
  }
}

// Supprime un labyrinthe
async function deleteLabyrinth(id, name) {
  if (!confirm(`Supprimer "${name}" ?`)) return
  try {
    await window.api.invoke('lab:delete', id)
    showToast(name + ' supprimé')
    loadLabyrinthes()
  } catch (err) {
    console.error('[deleteLabyrinth]', err)
  }
}

// ─────────────────────────────────────────────────────
// MODALE CRÉATION — openModal / closeModal
// ─────────────────────────────────────────────────────
function openModal(id) {
  const modal = document.getElementById(id)
  if (modal) modal.classList.remove('hidden')
}

function closeModal(id) {
  const modal = document.getElementById(id)
  if (modal) modal.classList.add('hidden')
}

function closeModalOutside(event, id) {
  // Ferme la modale si on clique sur le fond (backdrop)
  if (event.target.id === id) closeModal(id)
}

// ─────────────────────────────────────────────────────
// CRÉATION D'UN LABYRINTHE — handleCreateLabyrinth()
// Appelée depuis le HTML : onsubmit="handleCreateLabyrinth(event)"
// ─────────────────────────────────────────────────────
async function handleCreateLabyrinth(event) {
  event.preventDefault()

  const name       = document.getElementById('new-lab-name').value.trim()
  const size       = document.getElementById('new-lab-size').value
  const difficulty = parseInt(document.getElementById('new-lab-diff').value)

  if (!name) return

  try {
    // 1. Génère la grille
    const genResult = await window.api.invoke('lab:generate', {
      size, difficulty, userId: currentUser.id
    })

    if (!genResult.success) return

    // 2. Sauvegarde en base
    const saveResult = await window.api.invoke('lab:create', {
      userId:    currentUser.id,
      name,
      size,
      difficulty,
      gridJSON:  genResult.gridJSON
    })

    if (saveResult.success) {
      closeModal('modal-create')
      showToast('Labyrinthe "' + name + '" créé !')
      document.getElementById('new-lab-name').value = ''
      loadLabyrinthes()
    }

  } catch (err) {
    console.error('[handleCreateLabyrinth]', err)
  }
}

// ─────────────────────────────────────────────────────
// PAGE LABYRINTHE — generateMaze / solveMaze / clearSolution
// ─────────────────────────────────────────────────────

// Sélection de la taille sur la page labyrinthe
function selectSize(btn) {
  document.querySelectorAll('.size-btn').forEach(b => b.classList.remove('active'))
  btn.classList.add('active')
  selectedSize = btn.dataset.size
}

// Génère et affiche un labyrinthe
async function generateMaze() {
  const difficulty = parseInt(document.getElementById('difficulty').value)

  const overlay = document.getElementById('canvas-overlay')
  if (overlay) overlay.classList.remove('hidden')

  try {
    const result = await window.api.invoke('lab:generate', {
      size: selectedSize,
      difficulty,
      userId: currentUser?.id
    })

    if (result.success) {
      currentGrid = result.grid
      drawMaze(result.grid)
      document.getElementById('btn-clear').classList.add('hidden')
    }

  } catch (err) {
    console.error('[generateMaze]', err)
  } finally {
    if (overlay) overlay.classList.add('hidden')
  }
}

// Résout le labyrinthe avec A*
async function solveMaze() {
  if (!currentGrid) {
    showToast('Génère d\'abord un labyrinthe !')
    return
  }

  try {
    const result = await window.api.invoke('lab:solve', {
      gridJSON: JSON.stringify(currentGrid)
    })

    if (result.success) {
      drawSolutionPath(result.path)
      document.getElementById('btn-clear').classList.remove('hidden')
    } else {
      showToast('Aucune solution trouvée.')
    }

  } catch (err) {
    console.error('[solveMaze]', err)
  }
}

// Efface le chemin solution (redessine le labyrinthe sans le chemin)
function clearSolution() {
  if (currentGrid) {
    drawMaze(currentGrid)
    document.getElementById('btn-clear').classList.add('hidden')
  }
}

// ─────────────────────────────────────────────────────
// CANVAS — Rendu pixel art
// ─────────────────────────────────────────────────────
function drawMaze(grid) {
  const canvas   = document.getElementById('maze-canvas')
  const ctx      = canvas.getContext('2d')
  const rows     = grid.length
  const cols     = grid[0].length
  const cellSize = Math.floor(Math.min(canvas.width / cols, canvas.height / rows))

  // Redimensionne le canvas à la bonne taille
  canvas.width  = cols * cellSize
  canvas.height = rows * cellSize

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      ctx.fillStyle = grid[r][c] === 1 ? '#000000' : '#111111'
      ctx.fillRect(c * cellSize, r * cellSize, cellSize, cellSize)
    }
  }

  // Entrée : vert néon
  ctx.fillStyle = '#00FF41'
  ctx.fillRect(1 * cellSize, 0, cellSize, cellSize)

  // Sortie : rouge néon
  ctx.fillStyle = '#FF003C'
  ctx.fillRect((cols - 2) * cellSize, (rows - 1) * cellSize, cellSize, cellSize)
}

// Anime le chemin A* case par case
function drawSolutionPath(path) {
  const canvas   = document.getElementById('maze-canvas')
  const ctx      = canvas.getContext('2d')
  const cellSize = Math.floor(canvas.width / currentGrid[0].length)

  let i = 1  // on saute la case d'entrée (déjà en vert)
  const interval = setInterval(() => {
    if (i >= path.length - 1) {
      clearInterval(interval)
      return
    }
    const { r, c } = path[i]
    ctx.fillStyle = '#BF5FFF'
    ctx.fillRect(c * cellSize, r * cellSize, cellSize, cellSize)
    i++
  }, 15)
}

// ─────────────────────────────────────────────────────
// TOAST — showToast()
// Notification pixel art en bas de l'écran
// ─────────────────────────────────────────────────────
function showToast(message) {
  const toast = document.getElementById('toast')
  if (!toast) return
  toast.textContent = message
  toast.classList.remove('hidden')
  setTimeout(() => toast.classList.add('hidden'), 2500)
}

// ─────────────────────────────────────────────────────
// UTILITAIRES
// ─────────────────────────────────────────────────────
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}