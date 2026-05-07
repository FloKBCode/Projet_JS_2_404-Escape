// app.js — 404:ESCAPE
// Réécrit pour correspondre exactement à index.html
// ====================================================
// Utilise window.api.invoke() (contextIsolation: true)
// ====================================================

// ─────────────────────────────────────────────────────
// app.js — 404:ESCAPE

// ─────────────────────────────────────────────────────
// ÉTAT GLOBAL
// ─────────────────────────────────────────────────────
let currentUser  = null
let currentToken = null
let currentGrid  = null
let selectedSize = 'small'

// ─────────────────────────────────────────────────────
// NAVIGATION
// ─────────────────────────────────────────────────────
function goToPage(name) {
  document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'))
  const target = document.getElementById('page-' + name)
  if (target) target.classList.remove('hidden')

  // musique selon la page
  if (name === 'login')      playMenuMusic()
  if (name === 'dashboard')  { stopBgMusic(); loadLabyrinthes() }
  if (name === 'labyrinth')  playGameMusic()
  if (name === 'admin')      { stopBgMusic(); initAdminPage() }
}

// ─────────────────────────────────────────────────────
// ONGLETS LOGIN / INSCRIPTION
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
// CONNEXION
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
    soundError()
    return
  }

  try {
    const result = await window.api.invoke('auth:login', { email, password })

    if (result.success) {
      currentUser  = result.user
      currentToken = result.token

      const greeting = document.getElementById('user-greeting')
      if (greeting) greeting.textContent = '> ' + result.user.username.toUpperCase()

      const btnAdmin = document.getElementById('btn-admin')
      if (btnAdmin && result.user.role === 'admin') btnAdmin.hidden = false

      soundLogin()
      goToPage('dashboard')

    } else {
      errorEl.textContent = result.message || 'Email ou mot de passe incorrect.'
      errorEl.hidden = false
      soundError()
    }

  } catch (err) {
    errorEl.textContent = 'Erreur de connexion. Réessaie.'
    errorEl.hidden = false
    soundError()
    console.error('[login]', err)
  }
}

// ─────────────────────────────────────────────────────
// INSCRIPTION
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
    soundError()
    return
  }

  try {
    const result = await window.api.invoke('auth:register', { username, email, password })

    if (result.success) {
      currentUser  = result.user
      currentToken = result.token

      const greeting = document.getElementById('user-greeting')
      if (greeting) greeting.textContent = '> ' + result.user.username.toUpperCase()

      soundLogin()
      showToast('Bienvenue ' + username + ' !')
      goToPage('dashboard')

    } else {
      errorEl.textContent = result.message || 'Erreur lors de l\'inscription.'
      errorEl.hidden = false
      soundError()
    }

  } catch (err) {
    errorEl.textContent = 'Erreur serveur. Réessaie.'
    errorEl.hidden = false
    soundError()
    console.error('[register]', err)
  }
}

// ─────────────────────────────────────────────────────
// DÉCONNEXION
// ─────────────────────────────────────────────────────
function logout() {
  currentUser  = null
  currentToken = null
  currentGrid  = null

  const btnAdmin = document.getElementById('btn-admin')
  if (btnAdmin) btnAdmin.hidden = true

  switchTab('login')
  goToPage('login') // relance la musique d'accueil
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

async function openLabyrinth(id) {
  try {
    const result = await window.api.invoke('lab:getById', id)
    if (result.success && result.lab) {
      currentGrid = JSON.parse(result.lab.data)
      const titleEl = document.getElementById('lab-page-title')
      if (titleEl) titleEl.textContent = result.lab.name.toUpperCase()
      drawMaze(currentGrid)
      goToPage('labyrinth') // lance la musique de jeu
    }
  } catch (err) {
    console.error('[openLabyrinth]', err)
  }
}

async function deleteLabyrinth(id, name) {
  if (!confirm(`Supprimer "${name}" ?`)) return
  try {
    soundDelete()
    await window.api.invoke('lab:delete', id)
    showToast(name + ' supprimé')
    loadLabyrinthes()
  } catch (err) {
    console.error('[deleteLabyrinth]', err)
  }
}

// ─────────────────────────────────────────────────────
// MODALE
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
  if (event.target.id === id) closeModal(id)
}

// ─────────────────────────────────────────────────────
// CRÉATION D'UN LABYRINTHE
// ─────────────────────────────────────────────────────
async function handleCreateLabyrinth(event) {
  event.preventDefault()

  const name       = document.getElementById('new-lab-name').value.trim()
  const size       = document.getElementById('new-lab-size').value
  const difficulty = parseInt(document.getElementById('new-lab-diff').value)

  if (!name) return

  try {
    const genResult = await window.api.invoke('lab:generate', {
      size, difficulty, userId: currentUser.id
    })

    if (!genResult.success) return

    const saveResult = await window.api.invoke('lab:create', {
      userId:   currentUser.id,
      name,
      size,
      difficulty,
      gridJSON: genResult.gridJSON
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
// PAGE LABYRINTHE
// ─────────────────────────────────────────────────────
function selectSize(btn) {
  document.querySelectorAll('.size-btn').forEach(b => b.classList.remove('active'))
  btn.classList.add('active')
  selectedSize = btn.dataset.size
}

async function generateMaze() {
  const difficulty = parseInt(document.getElementById('difficulty').value)
  const overlay = document.getElementById('canvas-overlay')
  if (overlay) overlay.classList.remove('hidden')

  soundGenerate()

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

async function solveMaze() {
  if (!currentGrid) {
    showToast('Génère d\'abord un labyrinthe !')
    soundError()
    return
  }

  try {
    const result = await window.api.invoke('lab:solve', {
      gridJSON: JSON.stringify(currentGrid)
    })

    if (result.success) {
      soundSolve()
      drawSolutionPath(result.path)
      document.getElementById('btn-clear').classList.remove('hidden')
    } else {
      showToast('Aucune solution trouvée.')
      soundError()
    }

  } catch (err) {
    console.error('[solveMaze]', err)
  }
}

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

  canvas.width  = cols * cellSize
  canvas.height = rows * cellSize

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      ctx.fillStyle = grid[r][c] === 1 ? '#000000' : '#111111'
      ctx.fillRect(c * cellSize, r * cellSize, cellSize, cellSize)
    }
  }

  ctx.fillStyle = '#00FF41'
  ctx.fillRect(1 * cellSize, 0, cellSize, cellSize)

  ctx.fillStyle = '#FF003C'
  ctx.fillRect((cols - 2) * cellSize, (rows - 1) * cellSize, cellSize, cellSize)
}

function drawSolutionPath(path) {
  const canvas   = document.getElementById('maze-canvas')
  const ctx      = canvas.getContext('2d')
  const cellSize = Math.floor(canvas.width / currentGrid[0].length)

  let i = 1
  const interval = setInterval(() => {
    if (i >= path.length - 1) {
      clearInterval(interval)
      soundWin()
      return
    }
    const { r, c } = path[i]
    ctx.fillStyle = '#BF5FFF'
    ctx.fillRect(c * cellSize, r * cellSize, cellSize, cellSize)
    i++
  }, 15)
}

// ─────────────────────────────────────────────────────
// TOAST
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
// ─────────────────────────────────────────────────────
// SAUVEGARDE depuis la page labyrinthe
// ─────────────────────────────────────────────────────
async function handleSaveLabyrinth(event) {
  event.preventDefault()

  if (!currentGrid) {
    showToast('Génère d\'abord un labyrinthe !')
    return
  }

  const name = document.getElementById('save-lab-name').value.trim()
  if (!name) return

  try {
    const result = await window.api.invoke('lab:create', {
      userId:    currentUser.id,
      name,
      size:      selectedSize,
      difficulty: parseInt(document.getElementById('difficulty').value),
      gridJSON:  JSON.stringify(currentGrid)
    })

    if (result.success) {
      closeModal('modal-save')
      document.getElementById('save-lab-name').value = ''
      soundLogin()
      showToast('"' + name + '" sauvegardé !')
    }

  } catch (err) {
    console.error('[handleSaveLabyrinth]', err)
    showToast('Erreur lors de la sauvegarde.')
  }
}