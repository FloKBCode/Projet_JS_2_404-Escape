// ============================================================
// admin.js — Fonctionnalités administrateur
// Responsable : Marly
// ============================================================
// Ce fichier regroupe toutes les fonctions réservées au compte admin.
// Il ne fait PAS de SQL lui-même : il appelle les fonctions de database.js
// et les met en forme pour l'interface.
//
// ACCÈS ADMIN :
//   Seul un utilisateur avec role = 'admin' peut utiliser ces fonctions.
//   La vérification du rôle se fait dans main.js via auth.verifyToken()
//   AVANT d'appeler les fonctions ici.
//
// CE QUE FAIT L'ADMIN :
//   - Voir tous les utilisateurs (nom, email, nombre de labyrinthes)
//   - Supprimer un utilisateur (et tous ses labyrinthes automatiquement)
//   - Voir tous les labyrinthes de tous les utilisateurs
//   - Supprimer un labyrinthe problématique
//   - Consulter des statistiques globales (nb users, nb labyrinthes, moyenne...)
// ============================================================


// Fonctions du panneau admin, communique avec main.js via window.api.invoke()

// ── séance 2 ─────────────────────────────────────────────────
async function getStats() {
  try {
    const stats = await window.api.invoke('admin:getStats')
    const avg = stats.totalUsers > 0 ? (stats.totalLabyrinths / stats.totalUsers).toFixed(1) : '0'
    document.getElementById('stat-users').textContent = stats.totalUsers
    document.getElementById('stat-labs').textContent  = stats.totalLabyrinths
    document.getElementById('stat-avg').textContent   = avg
  } catch (err) {
    console.error('[admin] getStats() :', err)
  }
}

// ── séance 3 ─────────────────────────────────────────────────
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
        <td style="color:var(--white)">${user.username}</td>
        <td>${user.email}</td>
        <td style="color:var(--red)">${user.labyrinth_count ?? 0}</td>
        <td><button class="btn-icon danger" onclick="deleteUser(${user.id}, '${escapeHtml(user.username)}')">SUPPR.</button></td>
      `
      tbody.appendChild(row)
    })
  } catch (err) {
    console.error('[admin] getUsersList() :', err)
  }
}

// ── séance 4 ─────────────────────────────────────────────────
async function deleteUser(userId, username) {
  if (!confirm(`Supprimer "${username}" et tous ses labyrinthes ?`)) return
  try {
    await window.api.invoke('admin:deleteUser', userId)
    await getUsersList()
    await getLabyrinthsAll()
    await getStats()
    showToast(`${username} supprimé`)
  } catch (err) {
    console.error('[admin] deleteUser() :', err)
  }
}

async function getLabyrinthsAll() {
  const tbody = document.getElementById('labs-tbody')
  if (!tbody) return
  try {
    const labs = await window.api.invoke('admin:getAllLabyrinths')
    if (!labs || labs.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:var(--grey);">AUCUN LABYRINTHE</td></tr>`
      return
    }
    tbody.innerHTML = ''
    const sizes = { small: 'PETIT', medium: 'MOYEN', large: 'GRAND' }
    labs.forEach(lab => {
      const row = document.createElement('tr')
      row.innerHTML = `
        <td>${lab.id}</td>
        <td style="color:var(--white)">${escapeHtml(lab.name)}</td>
        <td>${escapeHtml(lab.owner_username)}</td>
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

async function deleteLabyrinth(labId, labName) {
  if (!confirm(`Supprimer "${labName}" ?`)) return
  try {
    await window.api.invoke('admin:deleteLabyrinth', labId)
    await getLabyrinthsAll()
    await getStats()
    showToast(`"${labName}" supprimé`)
  } catch (err) {
    console.error('[admin] deleteLabyrinth() :', err)
  }
}

// échappe les caractères HTML pour éviter les injections
function escapeHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;')
}

// appelée par app.js quand on arrive sur la page admin
async function initAdminPage() {
  await Promise.all([ getStats(), getUsersList(), getLabyrinthsAll() ])
}