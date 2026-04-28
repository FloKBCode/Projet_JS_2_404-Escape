// ============================================================
// labyrinth.js — Génération et résolution de labyrinthes
// Responsable : Florence
// ============================================================
// Ce fichier contient les algorithmes "cerveaux" du projet :
//
//   GÉNÉRATION :
//   ┌─────────────────────────────────────────────────────────┐
//   │ DFS (difficulté 1-6)                                    │
//   │   Creuse des passages en profondeur → longs couloirs    │
//   │   Labyrinthe linéaire, solution facile à trouver        │
//   │                                                         │
//   │ Kruskal (difficulté 7-10)                               │
//   │   Mélange les murs aléatoirement → plein de cul-de-sac  │
//   │   Labyrinthe "hérissé", solution difficile à trouver    │
//   └─────────────────────────────────────────────────────────┘
//
//   RÉSOLUTION :
//   ┌─────────────────────────────────────────────────────────┐
//   │ A* (A-star)                                             │
//   │   Combine le coût réel (cases parcourues)               │
//   │   + une estimation (distance à vol d'oiseau vers sortie)│
//   │   → TOUJOURS le chemin le plus court, très rapide       │
//   └─────────────────────────────────────────────────────────┘
//
// LE LABYRINTHE EN MÉMOIRE :
//   On représente le labyrinthe comme un tableau 2D de nombres :
//   1 = mur  (case noire, infranchissable)
//   0 = couloir (case vide, on peut passer)
//   Exemple 5x5 :
//   [1,1,1,1,1]
//   [1,0,0,0,1]
//   [1,0,1,0,1]
//   [1,0,0,0,1]
//   [1,1,1,1,1]
// ============================================================

const db = require('./database')

// Tailles prédéfinies (en nombre de cellules de couloir)
const SIZES = {
  small:  { rows: 11, cols: 11 },
  medium: { rows: 21, cols: 21 },
  large:  { rows: 31, cols: 41 },
}

// ============================================================
// GÉNÉRATION — Algorithme DFS (Depth-First Search)
// Utilisé pour difficulty 1 à 6
// ============================================================
// Principe : on part d'une cellule, on creuse en profondeur
// en choisissant un voisin aléatoire non visité.
// Quand on est bloqué, on "revient en arrière" (backtrack).
// Résultat : de longs couloirs avec peu de bifurcations.
// ============================================================
function generateDFS(rows, cols) {
  // Crée une grille entièrement remplie de murs (1)
  const grid = Array.from({ length: rows }, () => Array(cols).fill(1))

  // Les cellules "de couloir" sont aux positions impaires (1,1), (1,3), (3,1)...
  // Les murs entre elles sont aux positions paires
  function carve(r, c) {
    grid[r][c] = 0  // on "creuse" la cellule courante

    // Les 4 directions possibles : haut, bas, gauche, droite
    // On avance de 2 cases à chaque fois (pour sauter le mur entre deux cellules)
    const directions = [
      [-2, 0], [2, 0], [0, -2], [0, 2]
    ]

    // Mélange aléatoire pour que le labyrinthe soit différent à chaque fois
    directions.sort(() => Math.random() - 0.5)

    for (const [dr, dc] of directions) {
      const nr = r + dr
      const nc = c + dc

      // Vérifie que la cellule voisine est dans la grille et encore un mur
      if (nr > 0 && nr < rows - 1 && nc > 0 && nc < cols - 1 && grid[nr][nc] === 1) {
        // Creuse le mur ENTRE la cellule courante et la voisine
        grid[r + dr / 2][c + dc / 2] = 0
        carve(nr, nc)  // continue récursivement depuis la voisine
      }
    }
  }

  carve(1, 1)  // on commence toujours en (1,1)

  // Définit l'entrée (haut-gauche) et la sortie (bas-droite)
  grid[0][1] = 0                    // entrée
  grid[rows - 1][cols - 2] = 0     // sortie

  return grid
}

// ============================================================
// GÉNÉRATION — Algorithme Kruskal (version aléatoire)
// Utilisé pour difficulty 7 à 10
// ============================================================
// Principe : on traite les murs dans un ordre aléatoire.
// On casse un mur si les deux cellules qu'il sépare
// n'appartiennent pas encore au même ensemble (Union-Find).
// Résultat : beaucoup de cul-de-sac courts, très difficile.
// ============================================================
function generateKruskal(rows, cols) {
  const grid = Array.from({ length: rows }, () => Array(cols).fill(1))

  // Union-Find : structure pour savoir si deux cellules sont déjà connectées
  const parent = {}

  function find(x) {
    if (parent[x] !== x) parent[x] = find(parent[x])  // compression de chemin
    return parent[x]
  }

  function union(a, b) {
    parent[find(a)] = find(b)
  }

  // Initialise chaque cellule de couloir comme son propre ensemble
  const cells = []
  for (let r = 1; r < rows - 1; r += 2) {
    for (let c = 1; c < cols - 1; c += 2) {
      const key = `${r},${c}`
      parent[key] = key
      grid[r][c] = 0
      cells.push([r, c])
    }
  }

  // Collecte tous les murs entre cellules adjacentes
  const walls = []
  for (const [r, c] of cells) {
    if (r + 2 < rows - 1) walls.push([[r, c], [r + 2, c], [r + 1, c]])  // mur vertical
    if (c + 2 < cols - 1) walls.push([[r, c], [r, c + 2], [r, c + 1]])  // mur horizontal
  }

  // Mélange les murs aléatoirement (c'est là que la magie opère)
  walls.sort(() => Math.random() - 0.5)

  // Pour chaque mur, on l'abat si les deux cellules ne sont pas encore connectées
  for (const [a, b, wall] of walls) {
    const keyA = `${a[0]},${a[1]}`
    const keyB = `${b[0]},${b[1]}`

    if (find(keyA) !== find(keyB)) {
      // Les deux cellules ne sont pas encore dans le même ensemble → on casse le mur
      grid[wall[0]][wall[1]] = 0
      union(keyA, keyB)
    }
    // Si elles sont déjà connectées → on garde le mur (évite les boucles)
  }

  grid[0][1] = 0
  grid[rows - 1][cols - 2] = 0

  return grid
}

// ============================================================
// RÉSOLUTION — Algorithme A* (A-star)
// ============================================================
// Principe : explore les cases en priorisant celles qui semblent
// les plus prometteuses (proches de la sortie).
//
// Pour chaque case explorée, on calcule un score f = g + h :
//   g = coût réel depuis le départ (nombre de cases parcourues)
//   h = heuristique = distance de Manhattan jusqu'à la sortie
//       (distance à vol d'oiseau = |x1-x2| + |y1-y2|)
//
// On explore toujours la case avec le plus petit f.
// Résultat : chemin optimal garanti, très rapide.
//
// Retourne : tableau de positions { r, c } du chemin solution
//            ou [] si pas de solution
// ============================================================
function solveAStar(grid) {
  const rows = grid.length
  const cols = grid[0].length

  const start = { r: 0, c: 1 }                   // entrée
  const end   = { r: rows - 1, c: cols - 2 }     // sortie

  // Heuristique : distance de Manhattan
  function h(r, c) {
    return Math.abs(r - end.r) + Math.abs(c - end.c)
  }

  // File de priorité simplifiée (tableau trié)
  const open = [{ r: start.r, c: start.c, g: 0, f: h(start.r, start.c), path: [start] }]
  const visited = new Set()

  while (open.length > 0) {
    // Trie par f croissant et prend le meilleur nœud
    open.sort((a, b) => a.f - b.f)
    const current = open.shift()
    const key = `${current.r},${current.c}`

    if (visited.has(key)) continue
    visited.add(key)

    // On a trouvé la sortie !
    if (current.r === end.r && current.c === end.c) {
      return current.path  // retourne le chemin complet
    }

    // Explore les 4 voisins
    for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
      const nr = current.r + dr
      const nc = current.c + dc

      // Vérifie que c'est dans la grille, que c'est un couloir (0), et pas déjà visité
      if (
        nr >= 0 && nr < rows &&
        nc >= 0 && nc < cols &&
        grid[nr][nc] === 0 &&
        !visited.has(`${nr},${nc}`)
      ) {
        const g = current.g + 1
        open.push({
          r: nr, c: nc,
          g,
          f: g + h(nr, nc),
          path: [...current.path, { r: nr, c: nc }]
        })
      }
    }
  }

  return []  // pas de solution trouvée
}

// ============================================================
// FONCTIONS EXPOSÉES VIA IPC (appelées depuis main.js)
// ============================================================

// Génère un labyrinthe selon la taille et la difficulté
function generate({ size, difficulty, userId }) {
  const { rows, cols } = SIZES[size] || SIZES.medium

  // Choisit l'algorithme selon la difficulté
  const grid = difficulty <= 6
    ? generateDFS(rows, cols)
    : generateKruskal(rows, cols)

  const gridJSON = JSON.stringify(grid)

  return { success: true, grid, gridJSON, rows, cols }
}

// Résout un labyrinthe (reçoit le JSON de la grille)
function solve({ gridJSON }) {
  const grid = JSON.parse(gridJSON)
  const path = solveAStar(grid)

  if (path.length === 0) {
    return { success: false, message: 'Aucune solution trouvée.' }
  }

  return { success: true, path }
}

// Sauvegarde un labyrinthe en base (délègue à database.js)
function create({ userId, name, size, difficulty, gridJSON }) {
  const result = db.createLabyrinth({ userId, name, size, difficulty, gridJSON })
  return { success: true, id: result.id }
}

// Récupère tous les labyrinthes d'un utilisateur
function getAll(userId) {
  const labyrinthes = db.getLabyrinthsByUser(userId)
  return { success: true, labyrinthes }
}

// Modifie le nom d'un labyrinthe
function update({ id, name }) {
  // ✅ FIX : db.updateLabyrinth attend (id, name) séparés, pas un objet
  db.updateLabyrinth(id, name)
  return { success: true }
}

// Supprime un labyrinthe
function deleteById(id) {
  db.deleteLabyrinthById(id)
  return { success: true }
}

module.exports = { generate, solve, create, getAll, update, delete: deleteById }
