// ============================================================
// renderer/app.js — Interactions front-end et appels IPC
// Responsable : Sarah
// ============================================================
// Ce fichier est le "cerveau" du côté interface graphique.
// Il s'exécute dans la fenêtre du navigateur Electron (renderer).
//
// SON RÔLE :
//   1. Écouter les clics, soumissions de formulaires, etc.
//   2. Envoyer des requêtes au back-end via window.api (IPC)
//   3. Recevoir les réponses et mettre à jour l'interface (DOM)
//
// COMMENT PARLER AU BACK-END ?
//   On utilise window.api.invoke('nom-du-canal', données)
//   C'est le preload.js qui expose cette fonction de façon sécurisée.
//   Exemple :
//     const result = await window.api.invoke('auth:login', { email, password })
//     if (result.success) { /* connexion réussie */ }
//
// ÉTAT DE L'APPLICATION :
//   On garde en mémoire l'utilisateur connecté et son token JWT.
//   Toutes les pages de l'app sont dans index.html,
//   on affiche/cache les sections selon l'état de connexion.
//
// IMPORTANT : ce fichier ne fait PAS de SQL, ne lit PAS de fichiers.
//   Tout ça c'est le rôle de database.js côté back.
// ============================================================

