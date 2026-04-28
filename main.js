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
const path = require('path')

// On importe nos modules back-end
const { initDB, getLabyrinthById, createUser, getUserByEmail } = require('./database')
const authHandlers  = require('./auth')       // fonctions inscription/connexion
const labHandlers   = require('./labyrinth')  // fonctions génération/résolution
const adminHandlers = require('./admin')      // fonctions admin (stats, users)

// ⚠️  TEMP — Création du compte admin au premier lancement
// TODO : supprimer ces lignes une fois le compte admin créé
const bcrypt = require('bcryptjs')
initDB()
if (!getUserByEmail('admin@404.com')) {
  const hash = bcrypt.hashSync('admin123', 10)
  createUser({ username: 'admin', email: 'admin@404.com', hashedPassword: hash, role: 'admin' })
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
      // preload.js injecte ipcRenderer dans le renderer de façon sécurisée
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,   // sécurité : le renderer est isolé de Node.js
      nodeIntegration: false,   // sécurité : pas de Node.js direct dans le front
    },
    // TODO : ajouter une icône pixel art
    // icon: path.join(__dirname, 'renderer/assets/icon.png'),
    title: '404 : Escape',
  })

  // Charge la page HTML principale
  win.loadFile('renderer/index.html')

  // Ouvre les DevTools en développement (à retirer pour la version finale)
  //win.webContents.openDevTools()
}

// -------------------------------------------------------------
// Canaux IPC — AUTH (auth.js)
// -------------------------------------------------------------
// ipcMain.handle('nom-du-canal', handler)
// Le renderer appellera : ipcRenderer.invoke('nom-du-canal', données)

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
// Canaux IPC — LABYRINTHES (database.js + labyrinth.js)
// -------------------------------------------------------------

ipcMain.handle('lab:generate', async (event, data) => {
  // data = { size: 'small'|'medium'|'large', difficulty: 1-10, userId }
  return await labHandlers.generate(data)
})

ipcMain.handle('lab:solve', async (event, data) => {
  // data = { gridJSON } — retourne le chemin solution (A*)
  return await labHandlers.solve(data)
})

ipcMain.handle('lab:create', async (event, data) => {
  // data = { name, size, difficulty, gridJSON, userId }
  return await labHandlers.create(data)
})

ipcMain.handle('lab:getAll', async (event, userId) => {
  // Retourne tous les labyrinthes de l'utilisateur connecté
  return await labHandlers.getAll(userId)
})

// Canal pour ouvrir un labyrinthe existant depuis le dashboard
ipcMain.handle('lab:getById', async (event, id) => {
  // Retourne un labyrinthe complet (avec sa grille JSON) par son id
  const lab = getLabyrinthById(id)
  return { success: !!lab, lab }
})

ipcMain.handle('lab:update', async (event, data) => {
  // data = { id, name } — on peut modifier le nom du labyrinthe
  return await labHandlers.update(data)
})

ipcMain.handle('lab:delete', async (event, id) => {
  return await labHandlers.delete(id)
})

// -------------------------------------------------------------
// Canaux IPC — ADMIN (admin.js)
// -------------------------------------------------------------

ipcMain.handle('admin:getStats', async () => {
  return await adminHandlers.getStats()
})

ipcMain.handle('admin:getUsers', async () => {
  return await adminHandlers.getUsersList()
})

ipcMain.handle('admin:deleteUser', async (event, userId) => {
  return await adminHandlers.deleteUser(userId)
})

ipcMain.handle('admin:getAllLabyrinths', async () => {
  return await adminHandlers.getAllLabyrinths()
})

ipcMain.handle('admin:deleteLabyrinth', async (event, labId) => {
  return await adminHandlers.deleteLabyrinth(labId)
})

// -------------------------------------------------------------
// Cycle de vie de l'application Electron
// -------------------------------------------------------------

app.whenReady().then(() => {
  initDB()        // crée les tables SQLite si elles n'existent pas encore
  createWindow()  // ouvre la fenêtre

  // Sur macOS, re-créer la fenêtre si on clique sur l'icône du dock
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quitter l'app quand toutes les fenêtres sont fermées (sauf macOS)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})