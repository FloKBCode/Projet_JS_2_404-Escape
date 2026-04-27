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

