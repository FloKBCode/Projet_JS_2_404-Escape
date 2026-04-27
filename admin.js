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

