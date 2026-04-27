# 404 : Escape 🖥️

> *Après une nième nuit blanche, tu t'endors devant ton écran. Quand tu ouvres les yeux… tu es à l'intérieur du labyrinthe que tu codais. Vas-tu réussir à t'en sortir ?*

Application desktop multiplateforme de création et résolution de labyrinthes en pixel art, développée avec Electron.

---

## Stack technique

- **Electron** — application desktop
- **SQLite** (better-sqlite3) — base de données locale
- **bcryptjs** — hashage des mots de passe
- **jsonwebtoken** — authentification par token JWT

## Installation

```bash
git clone https://github.com/votre-repo/404-escape.git
cd 404-escape
npm install
npm start
```

## Structure du projet

```
404-escape/
├── main.js          # Point d'entrée Electron + canaux IPC
├── preload.js       # Pont sécurisé renderer ↔ main
├── auth.js          # Authentification bcrypt + JWT
├── database.js      # SQLite — connexion et CRUD
├── labyrinth.js     # Algorithmes DFS, Kruskal, A*
├── admin.js         # Fonctionnalités administrateur
├── package.json
└── renderer/
    ├── index.html   # Interface graphique
    ├── style.css    # Styles pixel art
    ├── app.js       # Interactions front + appels IPC
    └── assets/      # Polices, sons
```

## Équipe

| Membre | Rôle | Fichiers |
|---|---|---|
| Florence | Coordinatrice + Backend complexe | main.js, auth.js, labyrinth.js, preload.js |
| Marly | Front + admin.js | index.html, style.css, admin.js |
| Sarah | Front + database.js | index.html, style.css, database.js, app.js |

---

*Paris Ynov Campus — 2025-2026*
