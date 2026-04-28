// assets/sounds/sounds.js — Marly
// Gestion de TOUS les sons du jeu
// Sons ponctuels : générés via Web Audio API (pas de fichier externe)
// Musiques de fond : tes fichiers mp3 dans assets/music/

const AudioContext = window.AudioContext || window.webkitAudioContext
const ctx = new AudioContext()

let volume = 0.3
let bgAudio = null


// ─────────────────────────────────────────────────────
// UTILITAIRE — génère une note
// ─────────────────────────────────────────────────────
function playTone(freq, duration, type = 'square') {
  if (ctx.state === 'suspended') ctx.resume()
  const osc  = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.type = type
  osc.frequency.setValueAtTime(freq, ctx.currentTime)
  gain.gain.setValueAtTime(volume, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)
  osc.start(ctx.currentTime)
  osc.stop(ctx.currentTime + duration)
}


// ─────────────────────────────────────────────────────
// SONS PONCTUELS — générés en JS
// ─────────────────────────────────────────────────────

function soundBoot() {
  playTone(220, 0.1)
  setTimeout(() => playTone(330, 0.1), 100)
  setTimeout(() => playTone(440, 0.1), 200)
  setTimeout(() => playTone(660, 0.2), 300)
}

function soundLogin() {
  playTone(440, 0.08)
  setTimeout(() => playTone(550, 0.08), 90)
  setTimeout(() => playTone(660, 0.15), 180)
}

function soundError() {
  playTone(200, 0.1, 'sawtooth')
  setTimeout(() => playTone(150, 0.2, 'sawtooth'), 110)
}

function soundGenerate() {
  playTone(300, 0.05)
  setTimeout(() => playTone(350, 0.05), 60)
  setTimeout(() => playTone(400, 0.1), 120)
}

function soundSolve() {
  [523, 659, 784, 1047].forEach((freq, i) => {
    setTimeout(() => playTone(freq, 0.12), i * 100)
  })
}

function soundDelete() {
  playTone(300, 0.05, 'sawtooth')
  setTimeout(() => playTone(200, 0.15, 'sawtooth'), 60)
}

function soundClick() {
  playTone(600, 0.04, 'square')
}

function soundWin() {
  const melody = [
    [523, 0.1], [659, 0.1], [784, 0.1],
    [1047, 0.15], [784, 0.08], [1047, 0.3],
  ]
  let time = 0
  melody.forEach(([freq, dur]) => {
    setTimeout(() => playTone(freq, dur), time * 1000)
    time += dur + 0.04
  })
}


// ─────────────────────────────────────────────────────
// MUSIQUES DE FOND — tes fichiers mp3
// Mets tes fichiers dans renderer/assets/music/
// ─────────────────────────────────────────────────────

function playMenuMusic() {
  stopBgMusic()
  bgAudio = new Audio('./assets/music/menu.mp3')
  bgAudio.loop   = true
  bgAudio.volume = 0.3
  bgAudio.play().catch(() => {}) // catch si pas de fichier
}

function playGameMusic() {
  stopBgMusic()
  bgAudio = new Audio('./assets/music/game.mp3')
  bgAudio.loop   = true
  bgAudio.volume = 0.2
  bgAudio.play().catch(() => {}) // catch si pas de fichier
}

function stopBgMusic() {
  if (bgAudio) {
    bgAudio.pause()
    bgAudio.currentTime = 0
    bgAudio = null
  }
}


// ─────────────────────────────────────────────────────
// CONTRÔLE VOLUME
// ─────────────────────────────────────────────────────
function setVolume(val) {
  volume = Math.max(0, Math.min(1, val))
  if (bgAudio) bgAudio.volume = val
}

function muteToggle() {
  volume = volume > 0 ? 0 : 0.3
  if (bgAudio) bgAudio.volume = volume
}


// ─────────────────────────────────────────────────────
// CLIC automatique sur tous les boutons
// ─────────────────────────────────────────────────────
document.addEventListener('click', e => {
  if (e.target.tagName === 'BUTTON') soundClick()
})