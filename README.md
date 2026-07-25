# 🐠 Seahunter — 2D Underwater Shooter

A fast-paced **side-scrolling 2D shooter** built with vanilla JavaScript and HTML5 Canvas. Dive into the deep sea, blast through waves of hostile sea creatures, and rack up the highest score before time runs out!

![Game Preview](https://img.shields.io/badge/Engine-HTML5_Canvas-orange?style=for-the-badge)
![JS](https://img.shields.io/badge/Language-JavaScript-yellow?style=for-the-badge)
![Status](https://img.shields.io/badge/Status-Playable-brightgreen?style=for-the-badge)

---

## 🎮 Gameplay

You pilot a submarine through hostile underwater territory. Enemies approach from the right — shoot them down before they reach you or the timer runs out!

| Control | Action |
|---------|--------|
| `↑` / `↓` / `W` / `S` | Move up / down |
| `Space` | Fire torpedo |
| `M` | Toggle sound effects (Mute/Unmute) |
| `D` | Toggle debug hitboxes |
| `Enter` | Next Level / Restart |

### Objectives
- 🎯 **Conquer Infinite Levels** by reaching score targets before time expires
- 🛡️ **Protect your defense line** — do not let enemies escape past the left boundary
- 💥 Destroy enemies to earn points (tougher enemies = more points)
- ⚡ Catch the **Lucky Fish** (gold) for a power-up — dual torpedoes + HP repair!
- 🐋 Take down the **Hive Whale** and watch it release a swarm of Drones

---

## 🐟 Enemy Types

| Enemy | HP | Points | Special |
|-------|:--:|:------:|---------|
| **Angler 1** | 5 | 5 | Standard enemy |
| **Angler 2** | 6 | 6 | Tougher variant |
| **Lucky Fish** | 5 | 15 | Grants power-up + HP repair |
| **Hive Whale** | 20 | 20 | Spawns 5 Drones on death |
| **Drone** | 3 | 3 | Fast, spawned from Hive Whale |

---

## ✨ Features

- ♾️ **Endless / Infinite Level Generator** — levels dynamically scale up score targets (+150 pts/level), enemy speed (+0.15x), and spawn frequency beyond Level 5!
- 🔊 **Web Audio API Sound Synthesizer** — zero-dependency dynamic sound effects for torpedoes, explosions, hits, power-ups, victory fanfare, defeat sequences, and alarms
- 🏆 **5-Level Campaign System** with progressive targets, time limits, and unlocked enemy swarms
- 🌊 **Parallax scrolling** background with 4 depth layers
- 💣 **Particle effects** — spinning gear debris on hits and kills
- 🔥 **Dual explosion types** — smoke and fire
- ⚡ **Power-up system** — timed dual-fire mode with ammo regeneration
- 🎯 **Floating score numbers** — green `+N` on kills, red `-1` on collisions
- 📊 **Premium HUD** — gradient ammo bar, countdown timer bar, level status
- 📳 **Screen shake** on player damage
- 🔄 **Instant restart** — press Enter to play again

---

## 🚀 Getting Started

No build tools needed — just open the file in a browser!

```bash
# Clone the repo
git clone https://github.com/Hardiik12/Javascript-Game-.git

# Open in browser
open index.html
# or just double-click index.html
```

---

## 📁 Project Structure

```
Javascript-Game-/
├── index.html          # Entry point
├── style.css           # Premium dark theme + canvas glow
├── script.js           # All game logic (~900 lines)
└── assets/
    ├── player.png      # Player sprite sheet
    ├── angler1.png     # Enemy sprite sheet
    ├── angler2.png     # Enemy sprite sheet
    ├── lucky.png       # Lucky fish sprite sheet
    ├── hivewhale.png   # Hive whale sprite sheet
    ├── drone.png       # Drone sprite sheet
    ├── projectile.png  # Torpedo sprite
    ├── gears.png       # Particle sprite sheet
    ├── smokeExplosion.png
    ├── fireExplosion.png
    ├── layer1.png      # Background layer (far)
    ├── layer2.png      # Background layer
    ├── layer3.png      # Background layer
    └── layer4.png      # Foreground layer
```

---

## 🛠 Tech Stack

- **HTML5 Canvas** for rendering
- **Vanilla JavaScript** (ES6 classes, no frameworks)
- **CSS3** animations + gradients
- **Google Fonts** — Bangers, Orbitron

---

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

---

Made with ❤️ by [Hardiik12](https://github.com/Hardiik12)
