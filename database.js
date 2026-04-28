// database.js — 404:ESCAPE
// 💻 Sarah — Séance 2 : CRUD complet users + labyrinthes
// ============================================================

const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'escape.db'));

// ─────────────────────────────────────────────
// INITIALISATION DES TABLES
// ─────────────────────────────────────────────

function initDB() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      username   TEXT    NOT NULL UNIQUE,
      email      TEXT    NOT NULL UNIQUE,
      password   TEXT    NOT NULL,
      role       TEXT    NOT NULL DEFAULT 'user',
      created_at TEXT    DEFAULT (datetime('now'))
    )
  `);

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
  `);

  console.log('✅ Base de données initialisée — tables users & labyrinthes prêtes.');
}

// ─────────────────────────────────────────────
// CRUD — USERS
// ─────────────────────────────────────────────

/**
 * Crée un nouvel utilisateur.
 * @param {object} { username, email, hashedPassword, role }
 */
function createUser({ username, email, hashedPassword, role = 'user' }) {
  const stmt = db.prepare(`
    INSERT INTO users (username, email, password, role)
    VALUES (?, ?, ?, ?)
  `);
  const result = stmt.run(username, email, hashedPassword, role);
  return { id: result.lastInsertRowid, username, email, role };
}

/**
 * Récupère un utilisateur par son email.
 */
function getUserByEmail(email) {
  return db.prepare('SELECT * FROM users WHERE email = ?').get(email);
}

/**
 * Récupère un utilisateur par son ID.
 */
function getUserById(id) {
  return db.prepare('SELECT id, username, email, role, created_at FROM users WHERE id = ?').get(id);
}

/**
 * Récupère tous les utilisateurs (admin).
 */
function getAllUsers() {
  return db.prepare('SELECT id, username, email, role, created_at FROM users').all();
}

/**
 * Supprime un utilisateur par son ID (admin).
 */
function deleteUserById(id) {
  return db.prepare('DELETE FROM users WHERE id = ?').run(id);
}

/**
 * Compte le nombre total d'utilisateurs.
 */
function countUsers() {
  return db.prepare('SELECT COUNT(*) as count FROM users').get().count;
}

// ─────────────────────────────────────────────
// CRUD — LABYRINTHES
// ─────────────────────────────────────────────

/**
 * Crée un labyrinthe.
 * @param {object} { userId, name, size, difficulty, gridJSON }
 */
function createLabyrinth({ userId, name, size, difficulty, gridJSON }) {
  const stmt = db.prepare(`
    INSERT INTO labyrinthes (user_id, name, size, difficulty, data)
    VALUES (?, ?, ?, ?, ?)
  `);
  const result = stmt.run(userId, name, size, difficulty, gridJSON);
  return { id: result.lastInsertRowid, userId, name, size, difficulty };
}

/**
 * Récupère tous les labyrinthes d'un utilisateur.
 * Un user ne voit QUE ses labyrinthes.
 */
function getLabyrinthsByUser(userId) {
  return db.prepare('SELECT * FROM labyrinthes WHERE user_id = ? ORDER BY created_at DESC').all(userId);
}

/**
 * Récupère un labyrinthe par son ID.
 */
function getLabyrinthById(id) {
  return db.prepare('SELECT * FROM labyrinthes WHERE id = ?').get(id);
}

/**
 * Met à jour le nom d'un labyrinthe.
 */
function updateLabyrinth(id, name) {
  return db.prepare('UPDATE labyrinthes SET name = ? WHERE id = ?').run(name, id);
}

/**
 * Supprime un labyrinthe par son ID.
 */
function deleteLabyrinthById(id) {
  return db.prepare('DELETE FROM labyrinthes WHERE id = ?').run(id);
}

/**
 * Récupère tous les labyrinthes (admin).
 */
function getAllLabyrinths() {
  return db.prepare(`
    SELECT l.*, u.username 
    FROM labyrinthes l
    JOIN users u ON l.user_id = u.id
    ORDER BY l.created_at DESC
  `).all();
}

/**
 * Compte le nombre total de labyrinthes.
 */
function countLabyrinths() {
  return db.prepare('SELECT COUNT(*) as count FROM labyrinthes').get().count;
}

/**
 * Compte le nombre de labyrinthes par utilisateur.
 */
function countLabyrinthsPerUser() {
  return db.prepare(`
    SELECT u.username, COUNT(l.id) as count
    FROM users u
    LEFT JOIN labyrinthes l ON u.id = l.user_id
    GROUP BY u.id
  `).all();
}

// ─────────────────────────────────────────────
// EXPORTS
// ─────────────────────────────────────────────

module.exports = {
  db,
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
  updateLabyrinth,
  deleteLabyrinthById,
  getAllLabyrinths,
  countLabyrinths,
  countLabyrinthsPerUser,
};

// ─────────────────────────────────────────────
// TEST EN CONSOLE — node database.js
// ─────────────────────────────────────────────

if (require.main === module) {
  initDB();

  try {
    const user = createUser({ username: 'sarah_test', email: 'sarah@test.com', hashedPassword: 'hash_placeholder' });
    console.log('👤 Utilisateur créé :', user);
    console.log('🔍 getUserByEmail :', getUserByEmail('sarah@test.com'));

    const lab = createLabyrinth({ userId: user.id, name: 'Labyrinthe Test', size: 'moyen', difficulty: 3, gridJSON: '{}' });
    console.log('🗺️  Labyrinthe créé :', lab);
    console.log('🔍 getLabyrinthsByUser :', getLabyrinthsByUser(user.id));

    console.log('📊 countUsers :', countUsers());
    console.log('📊 countLabyrinths :', countLabyrinths());
    console.log('📊 countLabyrinthsPerUser :', countLabyrinthsPerUser());
  } catch (err) {
    console.error('❌ Erreur test :', err.message);
  }
}