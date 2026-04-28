// ============================================================
// admin.js — Interface administrateur (RENDERER)
// Responsable : Marly
// ============================================================
// Ce fichier tourne côté RENDERER (navigateur Electron).
// Il est chargé dans index.html via <script src="../admin.js">
// Il communique avec main.js via window.api.invoke()
//
// IMPORTANT : ce fichier ne fait PAS de require() ni de SQL.
//   Tout passe par les canaux IPC définis dans main.js :
//   admin:getStats, admin:getUsers, admin:deleteUser,
//   admin:getAllLabyrinths, admin:deleteLabyrinth
//
// La fonction initAdminPage() est appelée par app.js
// quand on navigue vers la page admin (goToPage('admin'))
// ============================================================

// ─────────────────────────────────────────────
// STATISTIQUES GLOBALES
// ─────────────────────────────────────────────

async function getStats() {
  try {
    const stats = await window.api.invoke('admin:getStats')
    document.getElementById('stat-users').textContent = stats.totalUsers      ?? '--'
    document.getElementById('stat-labs').textContent  = stats.totalLabyrinths ?? '--'
    document.getElementById('stat-avg').textContent   = stats.avgPerUser      ?? '--'
  } catch (err) {
    console.error('[admin] getStats() :', err)
  }
}

// ─────────────────────────────────────────────
// LISTE DES UTILISATEURS
// ─────────────────────────────────────────────

async function getUsersList() {
  const tbody = document.getElementById('users-tbody')
  if (!tbody) return

  try {
    const users = await window.api.invoke('admin:getUsers')

    if (!users || users.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:var(--grey);">AUCUN UTILISATEUR</td></tr>`
      return
    }

    tbody.innerHTML = ''
    users.forEach(user => {
      const row = document.createElement('tr')
      row.innerHTML = `
        <td>${user.id}</td>
        <td style="color:var(--white)">${escapeHtml(user.username)}</td>
        <td>${escapeHtml(user.email)}</td>
        <td style="color:var(--red)">${user.labyrinth_count ?? 0}</td>
        <td><button class="btn-icon danger" onclick="deleteUser(${user.id}, '${escapeHtml(user.username)}')">SUPPR.</button></td>
      `
      tbody.appendChild(row)
    })

  } catch (err) {
    console.error('[admin] getUsersList() :', err)
  }
}

// ─────────────────────────────────────────────
// SUPPRESSION UTILISATEUR
// ─────────────────────────────────────────────

async function deleteUser(userId, username) {
  if (!confirm(`Supprimer "${username}" et tous ses labyrinthes ?`)) return
  try {
    await window.api.invoke('admin:deleteUser', userId)
    showToast(`${username} supprimé`)
    await Promise.all([getStats(), getUsersList(), getLabyrinthsAll()])
  } catch (err) {
    console.error('[admin] deleteUser() :', err)
  }
}

// ─────────────────────────────────────────────
// LISTE DE TOUS LES LABYRINTHES
// ─────────────────────────────────────────────

async function getLabyrinthsAll() {
  const tbody = document.getElementById('labs-tbody')
  if (!tbody) return

  try {
    const labs = await window.api.invoke('admin:getAllLabyrinths')

    if (!labs || labs.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:var(--grey);">AUCUN LABYRINTHE</td></tr>`
      return
    }

    const sizes = { small: 'PETIT', medium: 'MOYEN', large: 'GRAND' }

    tbody.innerHTML = ''
    labs.forEach(lab => {
      const row = document.createElement('tr')
      row.innerHTML = `
        <td>${lab.id}</td>
        <td style="color:var(--white)">${escapeHtml(lab.name)}</td>
        <td>${escapeHtml(lab.username)}</td>
        <td>${sizes[lab.size] ?? lab.size}</td>
        <td style="color:var(--red)">${lab.difficulty}/10</td>
        <td><button class="btn-icon danger" onclick="deleteLabyrinth(${lab.id}, '${escapeHtml(lab.name)}')">SUPPR.</button></td>
      `
      tbody.appendChild(row)
    })

  } catch (err) {
    console.error('[admin] getLabyrinthsAll() :', err)
  }
}

// ─────────────────────────────────────────────
// SUPPRESSION LABYRINTHE
// ─────────────────────────────────────────────

async function deleteLabyrinth(labId, labName) {
  if (!confirm(`Supprimer "${labName}" ?`)) return
  try {
    await window.api.invoke('admin:deleteLabyrinth', labId)
    showToast(`"${labName}" supprimé`)
    await Promise.all([getStats(), getLabyrinthsAll()])
  } catch (err) {
    console.error('[admin] deleteLabyrinth() :', err)
  }
}

// ─────────────────────────────────────────────
// INIT — appelée par app.js via goToPage('admin')
// ─────────────────────────────────────────────

async function initAdminPage() {
  await Promise.all([getStats(), getUsersList(), getLabyrinthsAll()])
}

// ─────────────────────────────────────────────
// UTILITAIRE — protection contre les injections HTML
// ─────────────────────────────────────────────

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}