# Project Knowledge & Development History: Seahunter (2D Underwater Shooter)

## 🎮 Game Architecture & Tech Stack
- **Engine:** HTML5 Canvas (1500x500 resolution), Vanilla JavaScript (ES6 Classes).
- **Styling:** CSS3 dark ocean gradient, glassmorphism UI overlay elements, Orbitron & Bangers fonts.
- **Repository:** https://github.com/Hardiik12/Javascript-Game-

## 🔊 Sound System (`SoundController`)
- Zero-dependency procedural **Web Audio API Synthesizer** (Oscillators, Gain nodes, Biquad Filters, Noise buffers).
- **Audio Triggers:**
  - `playShot()`: Torpedo frequency sweep.
  - `playExplosion()`: Filtered white noise burst.
  - `playHit()`: Metallic impact triangle wave.
  - `playPowerup()`: Ascending 5-note arpeggio.
  - `playVictory()`: Upbeat victory fanfare.
  - `playDefeat()`: Descending defeat sequence.
  - `playAlarm()`: Two-tone emergency breach alert.
- **Controls:** Floating UI button + `M` key shortcut for Mute/Unmute. Auto-initializes on first user interaction.

## ♾️ Level & Progression System
- **Predefined Campaign (Levels 1–5):**
  - Level 1: Shallow Reef (75 pts in 75s)
  - Level 2: Midnight Trench (160 pts in 90s)
  - Level 3: Abyssal Caverns (250 pts in 105s)
  - Level 4: Coral Catacombs (380 pts in 120s)
  - Level 5: Leviathan Core (500 pts in 150s)
- **Infinite Generator (`getLevelConfig(index)`):**
  - Beyond Level 5, procedurally scales up score target (+150 pts/level), enemy speed (+0.15x), and spawn frequency (down to 350ms cap).
  - Rewards player with **+35 HP Repair** and full ammo refill on each level clear.

## 🕹️ Controls
- **`↑` / `↓` / `W` / `S`**: Move submarine.
- **`Space`**: Fire torpedoes.
- **`M`**: Toggle Mute/Unmute sound.
- **`D`**: Toggle debug hitboxes.
- **`Enter`**: Advance to next level / Restart after game over.
