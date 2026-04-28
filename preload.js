// ============================================================
// preload.js — Pont sécurisé entre le renderer et main.js
// Responsable : Florence
// ============================================================
// Ce fichier est le "douanier" entre le front (renderer) et le back (main.js).
// Il s'exécute dans un contexte intermédiaire qui a accès à la fois
// au monde Node.js ET au monde navigateur.
//
// POURQUOI ?
//   Pour des raisons de sécurité, le renderer ne peut pas appeler
//   directement require() ou les modules Node.js.
//   Ce fichier expose UNIQUEMENT les fonctions autorisées via contextBridge.
//
// RÉSULTAT :
//   Dans renderer/app.js, on peut écrire :
//     window.api.invoke('auth:login', données)
//   Ce qui est transformé en appel IPC vers main.js.
// ============================================================

const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('api', {
  invoke: (channel, data) => ipcRenderer.invoke(channel, data),
})