// ============================================================
// database.js — Connexion SQLite et fonctions CRUD
// Responsable : Sarah
// ============================================================
// Ce fichier est le "pont" entre l'application et la base de données.
// Il contient :
//   - La connexion à SQLite (un seul fichier .db sur le disque)
//   - La création des tables au premier lancement (initDB)
//   - Toutes les fonctions CRUD pour les users et les labyrinthes
//
// CRUD = Create, Read, Update, Delete (les 4 opérations de base sur une DB)
//
// POURQUOI SQLITE ?
//   SQLite stocke toute la base dans UN seul fichier (404escape.db).
//   Pas besoin d'installer un serveur de base de données séparé.
//   C'est parfait pour une application desktop comme la nôtre.
//
// COMMENT ÇA MARCHE ?
//   better-sqlite3 est "synchrone" : pas besoin d'async/await.
//   db.prepare('SELECT ...').get()   ──▶ retourne UN résultat
//   db.prepare('SELECT ...').all()   ──▶ retourne TOUS les résultats
//   db.prepare('INSERT ...').run()   ──▶ exécute et retourne { lastInsertRowid }
// ============================================================

// database.js — 404:ESCAPE
// 💻 Sarah — Séance 1 : connexion SQLite, tables, CRUD users
// ============================================================

const Database = require('better-sqlite3');
const path = require('path');

// Connexion à la base de données (créée automatiquement si elle n'existe pas)
const db = new Database(path.join(__dirname, 'escape.db'));

// ─────────────────────────────────────────────
// INITIALISATION DES TABLES
// ─────────────────────────────────────────────

function initDatabase() {
  // Table des utilisateurs
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id        INTEGER PRIMARY KEY AUTOINCREMENT,
      username  TEXT    NOT NULL UNIQUE,
      email     TEXT    NOT NULL UNIQUE,
      password  TEXT    NOT NULL,
      role      TEXT    NOT NULL DEFAULT 'user',
      created_at TEXT   DEFAULT (datetime('now'))
    )
  `);

  // Table des labyrinthes
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
 * @param {string} username
 * @param {string} email
 * @param {string} hashedPassword — mot de passe déjà hashé via bcrypt
 * @param {string} role — 'user' par défaut, 'admin' si besoin
 * @returns {object} l'utilisateur inséré
 */
function createUser(username, email, hashedPassword, role = 'user') {
  const stmt = db.prepare(`
    INSERT INTO users (username, email, password, role)
    VALUES (?, ?, ?, ?)
  `);
  const result = stmt.run(username, email, hashedPassword, role);
  return { id: result.lastInsertRowid, username, email, role };
}

/**
 * Récupère un utilisateur par son email.
 * @param {string} email
 * @returns {object|undefined} l'utilisateur ou undefined si non trouvé
 */
function getUserByEmail(email) {
  const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
  return stmt.get(email);
}

/**
 * Récupère un utilisateur par son ID.
 * @param {number} id
 * @returns {object|undefined}
 */
function getUserById(id) {
  const stmt = db.prepare('SELECT id, username, email, role, created_at FROM users WHERE id = ?');
  return stmt.get(id);
}

// ─────────────────────────────────────────────
// EXPORTS
// ─────────────────────────────────────────────

module.exports = {
  db,
  initDatabase,
  // Users
  createUser,
  getUserByEmail,
  getUserById,
};

// ─────────────────────────────────────────────
// TEST EN CONSOLE — node database.js
// ─────────────────────────────────────────────

if (require.main === module) {
  initDatabase();

  // Test : créer un utilisateur fictif
  try {
    const testUser = createUser('sarah_test', 'sarah@test.com', 'hash_bcrypt_placeholder');
    console.log('👤 Utilisateur créé :', testUser);

    const found = getUserByEmail('sarah@test.com');
    console.log('🔍 getUserByEmail :', found);

    const byId = getUserById(testUser.id);
    console.log('🔍 getUserById :', byId);
  } catch (err) {
    console.error('❌ Erreur test :', err.message);
  }
}