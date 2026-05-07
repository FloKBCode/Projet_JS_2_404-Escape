// database.js — 404:ESCAPE
// 💻 Sarah — Connexion SQLite + CRUD complet users + labyrinthes
// ============================================================
// Ce fichier est le "pont" entre l'application et la base de données.
// Il contient :
//   - La connexion à SQLite (un seul fichier .db sur le disque)
//   - La création des tables au premier lancement (initDB)
//   - Toutes les fonctions CRUD pour les users et les labyrinthes
//
// POURQUOI SQLITE ?
//   SQLite stocke toute la base dans UN seul fichier (escape.db).
//   Pas besoin d'installer un serveur de base de données séparé.
//   C'est parfait pour une application desktop comme la nôtre.
//
// CHEMIN DE LA BASE DE DONNÉES :
//   En développement (npm start) → dossier du projet
//   En production (.exe)         → C:\Users\...\AppData\Roaming\404-escape\
//   Le chemin userData est fourni par Electron et change selon l'environnement.
// ============================================================

const Database = require('better-sqlite3')
const path     = require('path')

// ─────────────────────────────────────────────────────────────
// CHEMIN DE LA BASE DE DONNÉES
// ─────────────────────────────────────────────────────────────
// En mode .exe, les fichiers sont dans une archive .asar (lecture seule).
// On ne peut donc PAS écrire dans __dirname.
// On utilise app.getPath('userData') qui pointe vers AppData/Roaming.
// En développement, app n'est pas encore prêt quand ce fichier est chargé,
// donc on retombe sur __dirname (dossier du projet).
// ─────────────────────────────────────────────────────────────
function getDbPath() {
  try {
    const { app } = require('electron')
    if (app && app.getPath) {
      return path.join(app.getPath('userData'), 'escape.db')
    }
  } catch (e) {
    // electron non disponible (ex: test en console node)
  }
  return path.join(__dirname, 'escape.db')
}

// La connexion est créée lors de initDB() pour s'assurer que
// app.getPath('userData') est disponible (app déjà prête)
let db = null

// ─────────────────────────────────────────────
// INITIALISATION DES TABLES
// Appelée dans app.whenReady() dans main.js
// ─────────────────────────────────────────────
function initDB() {
  const dbPath = getDbPath()
  db = new Database(dbPath)
  db.pragma('journal_mode = WAL')

  // Table des utilisateurs
  // role = 'user' par défaut, 'admin' pour le compte administrateur
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      username   TEXT    NOT NULL UNIQUE,
      email      TEXT    NOT NULL UNIQUE,
      password   TEXT    NOT NULL,
      role       TEXT    NOT NULL DEFAULT 'user',
      created_at TEXT    DEFAULT (datetime('now'))
    )
  `)

  // Table des labyrinthes
  // data : le labyrinthe sérialisé en JSON (tableau 2D de 0 et 1)
  // size : 'small' | 'medium' | 'large'
  // difficulty : entier de 1 à 10
  db.exec(`
    CREATE TABLE IF NOT EXISTS labyrinthes (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id     INTEGER NOT NULL,
      name        TEXT    NOT NULL,
      size        TEXT    NOT NULL,
      difficulty  INTEGER NOT NULL CHECK(difficulty BETWEEN 1 AND 10),
      data        TEXT,
      created_at  TEXT    DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `)

  console.log('✅ Base de données initialisée — tables users & labyrinthes prêtes.')
}

// ─────────────────────────────────────────────
// CRUD — USERS
// ─────────────────────────────────────────────

/**
 * Crée un nouvel utilisateur.
 * @param {object} { username, email, hashedPassword, role }
 * @returns {{ id, username, email, role }}
 */
function createUser({ username, email, hashedPassword, role = 'user' }) {
  const stmt = db.prepare(`
    INSERT INTO users (username, email, password, role)
    VALUES (?, ?, ?, ?)
  `)
  const result = stmt.run(username, email, hashedPassword, role)
  return { id: result.lastInsertRowid, username, email, role }
}

/**
 * Récupère un utilisateur par son email (utilisé pour la connexion).
 */
function getUserByEmail(email) {
  return db.prepare('SELECT * FROM users WHERE email = ?').get(email)
}

/**
 * Récupère un utilisateur par son ID.
 * Note : on n'expose pas le mot de passe hashé
 */
function getUserById(id) {
  return db.prepare('SELECT id, username, email, role, created_at FROM users WHERE id = ?').get(id)
}

/**
 * Récupère tous les utilisateurs (admin uniquement).
 */
function getAllUsers() {
  return db.prepare('SELECT id, username, email, role, created_at FROM users').all()
}

/**
 * Supprime un utilisateur par son ID.
 * Grâce au ON DELETE CASCADE, tous ses labyrinthes sont aussi supprimés.
 */
function deleteUserById(id) {
  return db.prepare('DELETE FROM users WHERE id = ?').run(id)
}

/**
 * Compte le nombre total d'utilisateurs.
 */
function countUsers() {
  return db.prepare('SELECT COUNT(*) as count FROM users').get().count
}

// ─────────────────────────────────────────────
// CRUD — LABYRINTHES
// ─────────────────────────────────────────────

/**
 * Crée un labyrinthe et le sauvegarde en base.
 * @param {object} { userId, name, size, difficulty, gridJSON }
 * gridJSON = JSON.stringify(tableau2D) — la grille du labyrinthe
 */
function createLabyrinth({ userId, name, size, difficulty, gridJSON }) {
  const stmt = db.prepare(`
    INSERT INTO labyrinthes (user_id, name, size, difficulty, data)
    VALUES (?, ?, ?, ?, ?)
  `)
  const result = stmt.run(userId, name, size, difficulty, gridJSON)
  return { id: result.lastInsertRowid, userId, name, size, difficulty }
}

/**
 * Récupère tous les labyrinthes d'UN utilisateur précis.
 * Chaque user ne voit QUE ses propres labyrinthes.
 */
function getLabyrinthsByUser(userId) {
  return db.prepare(`
    SELECT * FROM labyrinthes
    WHERE user_id = ?
    ORDER BY created_at DESC
  `).all(userId)
}

/**
 * Récupère UN labyrinthe complet (avec la grille JSON) par son ID.
 */
function getLabyrinthById(id) {
  return db.prepare('SELECT * FROM labyrinthes WHERE id = ?').get(id)
}

/**
 * Récupère TOUS les labyrinthes de TOUS les utilisateurs (admin uniquement).
 * Inclut le pseudo du propriétaire via une jointure.
 */
function getAllLabyrinths() {
  return db.prepare(`
    SELECT l.*, u.username
    FROM labyrinthes l
    JOIN users u ON l.user_id = u.id
    ORDER BY l.created_at DESC
  `).all()
}

/**
 * Modifie le nom d'un labyrinthe.
 * @param {number} id - l'id du labyrinthe
 * @param {string} name - le nouveau nom
 */
function updateLabyrinth(id, name) {
  return db.prepare('UPDATE labyrinthes SET name = ? WHERE id = ?').run(name, id)
}

/**
 * Supprime un labyrinthe par son ID.
 */
function deleteLabyrinthById(id) {
  return db.prepare('DELETE FROM labyrinthes WHERE id = ?').run(id)
}

/**
 * Compte le nombre total de labyrinthes.
 */
function countLabyrinths() {
  return db.prepare('SELECT COUNT(*) as count FROM labyrinthes').get().count
}

/**
 * Compte le nombre de labyrinthes par utilisateur.
 * Retourne un tableau [{ username, count }]
 */
function countLabyrinthsPerUser() {
  return db.prepare(`
    SELECT u.username, COUNT(l.id) as count
    FROM users u
    LEFT JOIN labyrinthes l ON u.id = l.user_id
    GROUP BY u.id
    ORDER BY count DESC
  `).all()
}

// ─────────────────────────────────────────────
// EXPORTS
// ─────────────────────────────────────────────
module.exports = {
  initDB,
  // Users
  createUser,
  getUserByEmail,
  getUserById,
  getAllUsers,
  deleteUserById,
  countUsers,
  // Labyrinthes
  createLabyrinth,
  getLabyrinthsByUser,
  getLabyrinthById,
  getAllLabyrinths,
  updateLabyrinth,
  deleteLabyrinthById,
  countLabyrinths,
  countLabyrinthsPerUser,
}