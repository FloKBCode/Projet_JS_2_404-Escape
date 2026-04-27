// ============================================================
// auth.js — Gestion de l'authentification
// Responsable : Florence
// ============================================================
// Ce fichier gère TOUT ce qui concerne les comptes utilisateurs :
//   - L'inscription (register) : hashage du mot de passe avec bcrypt
//   - La connexion (login)     : vérification + génération d'un token JWT
//
// POURQUOI BCRYPT ?
//   On ne stocke JAMAIS un mot de passe en clair dans la base.
//   Bcrypt transforme "monMotDePasse" en "$2b$10$xK9..." (hash impossible à inverser).
//   Même si quelqu'un vole la base de données, les mots de passe restent protégés.
//
// POURQUOI JWT ?
//   JWT (JSON Web Token) est un "badge" numérique.
//   Après connexion, le serveur génère un badge signé contenant { userId, role }.
//   À chaque requête suivante, le front envoie ce badge.
//   Le back vérifie la signature pour savoir qui fait la requête — sans retoucher la DB.
//
// SCHÉMA :
//   Inscription : mot_de_passe ──bcrypt.hash()──▶ hash ──▶ stocké en DB
//   Connexion   : mot_de_passe ──bcrypt.compare()──▶ OK ──▶ jwt.sign() ──▶ token renvoyé au front
//   Requête     : token ──jwt.verify()──▶ { userId, role } ──▶ accès autorisé ou non
// ============================================================

const bcrypt = require('bcryptjs')
const jwt    = require('jsonwebtoken')
const db     = require('./database')

// Clé secrète pour signer les tokens JWT
// TODO : en production, mettre cette clé dans une variable d'environnement (.env)
const JWT_SECRET  = '404escape_secret_key_change_in_prod'
const JWT_EXPIRES = '24h'   // le token expire après 24h

// -------------------------------------------------------------
// Inscription d'un nouvel utilisateur
// -------------------------------------------------------------
async function register({ username, email, password }) {
  try {
    // 1. Vérifier que l'email n'est pas déjà utilisé
    const existing = db.getUserByEmail(email)
    if (existing) {
      return { success: false, message: 'Cet email est déjà utilisé.' }
    }

    // 2. Hasher le mot de passe (10 = nombre de "rounds" de hashage, bon équilibre sécurité/vitesse)
    const hashedPassword = await bcrypt.hash(password, 10)

    // 3. Insérer l'utilisateur en base avec le hash (jamais le mot de passe en clair)
    const userId = db.createUser({ username, email, password: hashedPassword, role: 'user' })

    // 4. Générer un token JWT pour connecter l'utilisateur automatiquement après inscription
    const token = jwt.sign(
      { userId, role: 'user' },   // données encodées dans le token
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES }
    )

    return {
      success: true,
      token,
      user: { id: userId, username, email, role: 'user' }
    }

  } catch (error) {
    console.error('[auth] Erreur inscription :', error)
    return { success: false, message: 'Erreur lors de l\'inscription.' }
  }
}

// -------------------------------------------------------------
// Connexion d'un utilisateur existant
// -------------------------------------------------------------
async function login({ email, password }) {
  try {
    // 1. Récupérer l'utilisateur par email
    const user = db.getUserByEmail(email)
    if (!user) {
      return { success: false, message: 'Email ou mot de passe incorrect.' }
    }

    // 2. Comparer le mot de passe saisi avec le hash stocké en base
    //    bcrypt.compare() retourne true si c'est le bon mot de passe
    const isValid = await bcrypt.compare(password, user.password)
    if (!isValid) {
      return { success: false, message: 'Email ou mot de passe incorrect.' }
    }

    // 3. Générer le token JWT avec les infos utiles (userId + role)
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES }
    )

    return {
      success: true,
      token,
      user: { id: user.id, username: user.username, email: user.email, role: user.role }
    }

  } catch (error) {
    console.error('[auth] Erreur connexion :', error)
    return { success: false, message: 'Erreur lors de la connexion.' }
  }
}

// -------------------------------------------------------------
// Middleware : vérifier un token JWT
// Utilisé dans main.js avant d'exécuter des actions sensibles
// -------------------------------------------------------------
function verifyToken(token) {
  try {
    // jwt.verify() lève une erreur si le token est invalide ou expiré
    const decoded = jwt.verify(token, JWT_SECRET)
    return { valid: true, userId: decoded.userId, role: decoded.role }
  } catch (error) {
    return { valid: false, message: 'Token invalide ou expiré.' }
  }
}

// -------------------------------------------------------------
// Middleware : vérifier qu'un utilisateur est admin
// -------------------------------------------------------------
function requireAdmin(token) {
  const result = verifyToken(token)
  if (!result.valid)          return { authorized: false, message: result.message }
  if (result.role !== 'admin') return { authorized: false, message: 'Accès réservé à l\'administrateur.' }
  return { authorized: true, userId: result.userId }
}

module.exports = { register, login, verifyToken, requireAdmin }
