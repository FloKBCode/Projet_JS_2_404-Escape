// ============================================================
// main.js — Point d'entrée principal de l'application Electron
// Responsable : Florence
// ============================================================
// Ce fichier est LE fichier qui lance toute l'application.
// Il s'exécute côté "backend" Node.js (pas dans le navigateur).
// C'est lui qui :
//   1. Crée la fenêtre de l'application (BrowserWindow)
//   2. Charge la page HTML principale (renderer/index.html)
//   3. Gère les communications entre le front (renderer) et le back (Node.js)
//      via un système appelé IPC (Inter-Process Communication)
//
// SCHÉMA DE FONCTIONNEMENT :
//   renderer/app.js  ──ipcRenderer.invoke('nom')──▶  main.js
//   main.js          ──ipcMain.handle('nom')──▶       exécute la fonction back
//   main.js          ──return résultat──▶              renderer/app.js
//
// IMPORTANT : le renderer ne peut PAS accéder directement à Node.js
// (pas de require, pas de fs, pas de SQLite depuis le front).
// Tout passe obligatoirement par les canaux IPC définis ici.
// ============================================================

const { app, BrowserWindow, ipcMain } = require('electron')
const path   = require('path')
const bcrypt = require('bcryptjs')

// On importe nos modules back-end
const db           = require('./database')   // SQLite — toutes les fonctions CRUD
const authHandlers = require('./auth')       // inscription / connexion / JWT
const labHandlers  = require('./labyrinth')  // génération DFS/Kruskal + résolution A*
// Note : admin.js est un fichier RENDERER (chargé dans index.html via <script>)
//        Les fonctions admin sont donc gérées ici directement via db.*

// -------------------------------------------------------------
// Création du compte admin au premier lancement
// Ignoré si le compte existe déjà en base
// -------------------------------------------------------------
db.initDB()
if (!db.getUserByEmail('admin@404.com')) {
  const hash = bcrypt.hashSync('admin123', 10)
  db.createUser({ username: 'admin', email: 'admin@404.com', hashedPassword: hash, role: 'admin' })
  console.log('✅ Compte admin créé : admin@404.com / admin123')
}

// -------------------------------------------------------------
// Création de la fenêtre principale
// -------------------------------------------------------------
function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      // preload.js expose window.api au renderer de façon sécurisée
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,   // sécurité : le renderer est isolé de Node.js
      nodeIntegration: false,   // sécurité : pas de Node.js direct dans le front
    },
    // icon: path.join(__dirname, 'renderer/assets/icon.png'),
    title: '404 : Escape',
  })

  win.loadFile('renderer/index.html')
  // win.webContents.openDevTools()  // décommenter pour déboguer
}

// -------------------------------------------------------------
// Canaux IPC — AUTH (auth.js)
// -------------------------------------------------------------

ipcMain.handle('auth:register', async (event, data) => {
  // data = { username, email, password }
  return await authHandlers.register(data)
})

ipcMain.handle('auth:login', async (event, data) => {
  // data = { email, password }
  // Retourne : { success, token, user } ou { success: false, message }
  return await authHandlers.login(data)
})

// -------------------------------------------------------------
// Canaux IPC — LABYRINTHES (labyrinth.js + database.js)
// -------------------------------------------------------------

ipcMain.handle('lab:generate', (event, data) => {
  // data = { size: 'small'|'medium'|'large', difficulty: 1-10 }
  return labHandlers.generate(data)
})

ipcMain.handle('lab:solve', (event, data) => {
  // data = { gridJSON } — retourne le chemin solution A*
  return labHandlers.solve(data)
})

ipcMain.handle('lab:create', (event, data) => {
  // data = { userId, name, size, difficulty, gridJSON }
  return labHandlers.create(data)
})

ipcMain.handle('lab:getAll', (event, userId) => {
  // Retourne tous les labyrinthes de l'utilisateur connecté
  return labHandlers.getAll(userId)
})

ipcMain.handle('lab:getById', (event, id) => {
  // Retourne un labyrinthe complet avec sa grille JSON
  // Utilisé par app.js dans openLabyrinth()
  const lab = db.getLabyrinthById(id)
  return { success: !!lab, lab }
})

ipcMain.handle('lab:update', (event, data) => {
  // data = { id, name }
  return labHandlers.update(data)
})

ipcMain.handle('lab:delete', (event, id) => {
  return labHandlers.delete(id)
})

// -------------------------------------------------------------
// Canaux IPC — ADMIN
// Gérés directement ici via db.* car admin.js est côté renderer
// -------------------------------------------------------------

ipcMain.handle('admin:getStats', () => {
  // Statistiques globales pour le dashboard admin
  const totalUsers      = db.countUsers()
  const totalLabyrinths = db.countLabyrinths()
  const perUser         = db.countLabyrinthsPerUser()
  const avgPerUser      = totalUsers > 0
    ? (totalLabyrinths / totalUsers).toFixed(1)
    : '0'
  return { success: true, totalUsers, totalLabyrinths, avgPerUser, perUser }
})

ipcMain.handle('admin:getUsers', () => {
  // Tous les users enrichis de leur nombre de labyrinthes
  const users    = db.getAllUsers()
  const perUser  = db.countLabyrinthsPerUser()
  const countMap = {}
  for (const row of perUser) countMap[row.username] = row.count
  return users.map(u => ({ ...u, labyrinth_count: countMap[u.username] || 0 }))
})

ipcMain.handle('admin:deleteUser', (event, userId) => {
  // Supprime l'user ET tous ses labyrinthes (ON DELETE CASCADE dans SQLite)
  db.deleteUserById(userId)
  return { success: true }
})

ipcMain.handle('admin:getAllLabyrinths', () => {
  // Tous les labyrinthes de tous les users avec leur pseudo
  return db.getAllLabyrinths()
})

ipcMain.handle('admin:deleteLabyrinth', (event, labId) => {
  db.deleteLabyrinthById(labId)
  return { success: true }
})

// -------------------------------------------------------------
// Cycle de vie de l'application Electron
// -------------------------------------------------------------

app.whenReady().then(() => {
  createWindow()

  // Sur macOS, re-créer la fenêtre si on clique sur l'icône du dock
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quitter l'app quand toutes les fenêtres sont fermées (sauf macOS)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})