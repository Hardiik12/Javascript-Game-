window.addEventListener('load', function () {
    // canvas setup
    const canvas = document.getElementById('canvas1');
    const ctx = canvas.getContext('2d');
    canvas.width = 1500;
    canvas.height = 500;

    // ── LEVEL DEFINITIONS ──
    const LEVELS = [
        {
            level: 1,
            name: 'Shallow Reef',
            targetScore: 75,
            timeLimit: 75000,
            enemyInterval: 1600,
            speedModifier: 1.0,
            unlockedEnemies: ['angler1', 'lucky'],
            description: 'Warm shallow waters. Score 75 pts in 75s!'
        },
        {
            level: 2,
            name: 'Midnight Trench',
            targetScore: 160,
            timeLimit: 90000,
            enemyInterval: 1400,
            speedModifier: 1.25,
            unlockedEnemies: ['angler1', 'angler2', 'lucky'],
            description: 'Pitch black depths. Score 160 pts in 90s!'
        },
        {
            level: 3,
            name: 'Abyssal Caverns',
            targetScore: 250,
            timeLimit: 105000,
            enemyInterval: 1100,
            speedModifier: 1.5,
            unlockedEnemies: ['angler1', 'angler2', 'lucky', 'hive'],
            description: 'Abyssal Swarms! Score 250 pts in 105s!'
        },
        {
            level: 4,
            name: 'Coral Catacombs',
            targetScore: 380,
            timeLimit: 120000,
            enemyInterval: 900,
            speedModifier: 1.85,
            unlockedEnemies: ['angler1', 'angler2', 'lucky', 'hive', 'drone'],
            description: 'High Speed Invasion! Score 380 pts in 120s!'
        },
        {
            level: 5,
            name: 'Leviathan Core',
            targetScore: 500,
            timeLimit: 150000,
            enemyInterval: 700,
            speedModifier: 2.2,
            unlockedEnemies: ['angler1', 'angler2', 'lucky', 'hive', 'drone'],
            description: 'FINAL ASSAULT! Score 500 pts in 150s to save the ocean!'
        }
    ];

    // ── INFINITE LEVEL GENERATOR ──
    function getLevelConfig(index) {
        if (index < LEVELS.length) {
            return LEVELS[index];
        } else {
            const extraLevel = index + 1;
            const targetScore = 500 + (extraLevel - 5) * 150;
            const timeLimit = Math.min(180000, 150000 + (extraLevel - 5) * 15000);
            const enemyInterval = Math.max(350, 700 - (extraLevel - 5) * 50);
            const speedModifier = Number((2.2 + (extraLevel - 5) * 0.15).toFixed(2));
            return {
                level: extraLevel,
                name: `Abyssal Depth ${extraLevel}`,
                targetScore: targetScore,
                timeLimit: timeLimit,
                enemyInterval: enemyInterval,
                speedModifier: speedModifier,
                unlockedEnemies: ['angler1', 'angler2', 'lucky', 'hive', 'drone'],
                description: `INFINITE WAVE — Level ${extraLevel}! Target: ${targetScore} pts!`
            };
        }
    }

    // ── SOUND CONTROLLER (Web Audio API Synthesizer) ──
    class SoundController {
        constructor() {
            this.audioCtx = null;
            this.muted = false;
            this.btn = document.getElementById('soundBtn');
            if (this.btn) {
                this.btn.addEventListener('click', () => this.toggleMute());
            }
        }
        init() {
            if (!this.audioCtx) {
                const AudioContext = window.AudioContext || window.webkitAudioContext;
                if (AudioContext) {
                    this.audioCtx = new AudioContext();
                }
            }
            if (this.audioCtx && this.audioCtx.state === 'suspended') {
                this.audioCtx.resume();
            }
        }
        toggleMute() {
            this.init();
            this.muted = !this.muted;
            if (this.btn) {
                if (this.muted) {
                    this.btn.innerText = '🔇 Muted [M]';
                    this.btn.classList.add('muted');
                } else {
                    this.btn.innerText = '🔊 Sound ON [M]';
                    this.btn.classList.remove('muted');
                    this.playPowerup();
                }
            }
        }
        playShot() {
            if (this.muted) return;
            this.init();
            if (!this.audioCtx) return;

            const osc = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();
            const now = this.audioCtx.currentTime;

            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(800, now);
            osc.frequency.exponentialRampToValueAtTime(150, now + 0.12);

            gain.gain.setValueAtTime(0.2, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

            osc.connect(gain);
            gain.connect(this.audioCtx.destination);

            osc.start(now);
            osc.stop(now + 0.12);
        }
        playExplosion() {
            if (this.muted) return;
            this.init();
            if (!this.audioCtx) return;

            const bufferSize = Math.floor(this.audioCtx.sampleRate * 0.3);
            const buffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = Math.random() * 2 - 1;
            }

            const noise = this.audioCtx.createBufferSource();
            noise.buffer = buffer;

            const filter = this.audioCtx.createBiquadFilter();
            filter.type = 'lowpass';
            const now = this.audioCtx.currentTime;
            filter.frequency.setValueAtTime(800, now);
            filter.frequency.exponentialRampToValueAtTime(80, now + 0.3);

            const gain = this.audioCtx.createGain();
            gain.gain.setValueAtTime(0.35, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

            noise.connect(filter);
            filter.connect(gain);
            gain.connect(this.audioCtx.destination);

            noise.start(now);
            noise.stop(now + 0.3);
        }
        playHit() {
            if (this.muted) return;
            this.init();
            if (!this.audioCtx) return;

            const osc = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();
            const now = this.audioCtx.currentTime;

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(300, now);
            osc.frequency.exponentialRampToValueAtTime(80, now + 0.08);

            gain.gain.setValueAtTime(0.3, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);

            osc.connect(gain);
            gain.connect(this.audioCtx.destination);

            osc.start(now);
            osc.stop(now + 0.08);
        }
        playPowerup() {
            if (this.muted) return;
            this.init();
            if (!this.audioCtx) return;

            const now = this.audioCtx.currentTime;
            const freqs = [350, 523.25, 659.25, 783.99, 1046.5];
            freqs.forEach((f, i) => {
                const osc = this.audioCtx.createOscillator();
                const gain = this.audioCtx.createGain();
                const startTime = now + i * 0.06;

                osc.type = 'sine';
                osc.frequency.setValueAtTime(f, startTime);

                gain.gain.setValueAtTime(0.25, startTime);
                gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.12);

                osc.connect(gain);
                gain.connect(this.audioCtx.destination);

                osc.start(startTime);
                osc.stop(startTime + 0.12);
            });
        }
        playVictory() {
            if (this.muted) return;
            this.init();
            if (!this.audioCtx) return;

            const now = this.audioCtx.currentTime;
            const notes = [
                { f: 523.25, duration: 0.12, time: 0 },
                { f: 659.25, duration: 0.12, time: 0.14 },
                { f: 783.99, duration: 0.12, time: 0.28 },
                { f: 1046.50, duration: 0.35, time: 0.42 }
            ];

            notes.forEach(note => {
                const osc = this.audioCtx.createOscillator();
                const gain = this.audioCtx.createGain();
                const startTime = now + note.time;

                osc.type = 'triangle';
                osc.frequency.setValueAtTime(note.f, startTime);

                gain.gain.setValueAtTime(0.3, startTime);
                gain.gain.exponentialRampToValueAtTime(0.01, startTime + note.duration);

                osc.connect(gain);
                gain.connect(this.audioCtx.destination);

                osc.start(startTime);
                osc.stop(startTime + note.duration);
            });
        }
        playDefeat() {
            if (this.muted) return;
            this.init();
            if (!this.audioCtx) return;

            const now = this.audioCtx.currentTime;
            const notes = [
                { f: 400, duration: 0.15, time: 0 },
                { f: 350, duration: 0.15, time: 0.16 },
                { f: 300, duration: 0.15, time: 0.32 },
                { f: 220, duration: 0.45, time: 0.48 }
            ];

            notes.forEach(note => {
                const osc = this.audioCtx.createOscillator();
                const gain = this.audioCtx.createGain();
                const startTime = now + note.time;

                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(note.f, startTime);

                gain.gain.setValueAtTime(0.25, startTime);
                gain.gain.exponentialRampToValueAtTime(0.01, startTime + note.duration);

                osc.connect(gain);
                gain.connect(this.audioCtx.destination);

                osc.start(startTime);
                osc.stop(startTime + note.duration);
            });
        }
        playAlarm() {
            if (this.muted) return;
            this.init();
            if (!this.audioCtx) return;

            const osc = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();
            const now = this.audioCtx.currentTime;

            osc.type = 'square';
            osc.frequency.setValueAtTime(880, now);
            osc.frequency.setValueAtTime(440, now + 0.08);

            gain.gain.setValueAtTime(0.2, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.16);

            osc.connect(gain);
            gain.connect(this.audioCtx.destination);

            osc.start(now);
            osc.stop(now + 0.16);
        }
    }

    class InputHandler {
        constructor(game) {
            this.game = game;
            window.addEventListener('keydown', e => {
                if (this.game.sound) this.game.sound.init();
                if (
                    (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'w' || e.key === 's') &&
                    this.game.keys.indexOf(e.key) === -1
                ) {
                    this.game.keys.push(e.key);
                } else if (e.key === ' ') {
                    this.game.player.shootTop();
                } else if (e.key === 'd' || e.key === 'D') {
                    this.game.debug = !this.game.debug;
                } else if (e.key === 'm' || e.key === 'M') {
                    if (this.game.sound) this.game.sound.toggleMute();
                } else if (e.key === 'Enter') {
                    if (this.game.levelCompleted) {
                        this.game.nextLevel();
                    } else if (this.game.gameOver) {
                        this.game.restart();
                    }
                }
            });
            window.addEventListener('keyup', e => {
                if (this.game.keys.indexOf(e.key) > -1) {
                    this.game.keys.splice(this.game.keys.indexOf(e.key), 1);
                }
            });
        }
    }

    class Projectile {
        constructor(game, x, y) {
            this.game = game;
            this.x = x;
            this.y = y;
            this.width = 10;
            this.height = 3;
            this.speed = 4.5;
            this.markedForDeletion = false;
            this.image = document.getElementById('projectile');
        }
        update() {
            this.x += this.speed;
            if (this.x > this.game.width * 0.95) this.markedForDeletion = true;
        }
        draw(context) {
            context.drawImage(this.image, this.x, this.y);
        }
    }

    class Particle {
        constructor(game, x, y) {
            this.game = game;
            this.x = x;
            this.y = y;
            this.image = document.getElementById('gears');
            this.frameX = Math.floor(Math.random() * 3);
            this.frameY = Math.floor(Math.random() * 3);
            this.spriteSize = 50;
            this.sizeModifier = (Math.random() * 0.5 + 0.5).toFixed(1);
            this.size = this.spriteSize * this.sizeModifier;
            this.speedX = Math.random() * 6 - 3;
            this.speedY = Math.random() * -15;
            this.gravity = 0.5;
            this.markedForDeletion = false;
            this.angle = 0;
            this.va = Math.random() * 0.2 - 0.1;
            this.bounced = 0;
            this.bottomBounceBoundary = Math.random() * 80 + 60;
        }
        update() {
            this.angle += this.va;
            this.speedY += this.gravity;
            this.x -= this.speedX + this.game.speed;
            this.y += this.speedY;
            if (this.y > this.game.height + this.size || this.x < 0 - this.size)
                this.markedForDeletion = true;
            if (this.y > this.game.height - this.bottomBounceBoundary && this.bounced < 5) {
                this.bounced++;
                this.speedY *= -0.7;
            }
        }
        draw(context) {
            context.save();
            context.translate(this.x, this.y);
            context.rotate(this.angle);
            context.drawImage(
                this.image,
                this.frameX * this.spriteSize,
                this.frameY * this.spriteSize,
                this.spriteSize,
                this.spriteSize,
                this.size * -0.5,
                this.size * -0.5,
                this.size,
                this.size
            );
            context.restore();
        }
    }

    // ── Floating Combat Text ──
    class FloatingText {
        constructor(text, x, y, color = '#00ffc8', fontSize = 24) {
            this.text = text;
            this.x = x;
            this.y = y;
            this.color = color;
            this.fontSize = fontSize;
            this.markedForDeletion = false;
            this.timer = 0;
            this.lifeSpan = 1500;
            this.speedY = -1.2;
            this.opacity = 1;
        }
        update(deltaTime) {
            this.y += this.speedY;
            this.timer += deltaTime;
            if (this.timer > this.lifeSpan * 0.5) {
                this.opacity -= 0.025;
            }
            if (this.timer >= this.lifeSpan) this.markedForDeletion = true;
        }
        draw(context) {
            context.save();
            context.globalAlpha = Math.max(0, this.opacity);
            context.font = `bold ${this.fontSize}px Orbitron, sans-serif`;
            context.shadowColor = 'black';
            context.shadowBlur = 8;
            context.fillStyle = this.color;
            context.fillText(this.text, this.x, this.y);
            context.restore();
        }
    }

    class Player {
        constructor(game) {
            this.game = game;
            this.width = 120;
            this.height = 190;
            this.x = 20;
            this.y = 100;
            this.frameX = 0;
            this.frameY = 1;
            this.maxFrame = 37;
            this.speedY = 0;
            this.maxSpeed = 4.5;
            this.projectiles = [];
            this.image = document.getElementById('player');
            this.powerUp = false;
            this.powerUpTimer = 0;
            this.powerUpLimit = 10000;
        }
        update(deltaTime) {
            if (this.game.keys.includes('ArrowUp') || this.game.keys.includes('w')) this.speedY = -this.maxSpeed;
            else if (this.game.keys.includes('ArrowDown') || this.game.keys.includes('s'))
                this.speedY = this.maxSpeed;
            else this.speedY = 0;

            this.y += this.speedY;

            // vertical boundaries
            if (this.y > this.game.height - this.height * 0.5)
                this.y = this.game.height - this.height * 0.5;
            else if (this.y < -this.height * 0.5) this.y = -this.height * 0.5;

            // handle projectiles
            this.projectiles.forEach(projectile => {
                projectile.update();
            });
            this.projectiles = this.projectiles.filter(
                projectile => !projectile.markedForDeletion
            );

            // sprite animation
            if (this.frameX < this.maxFrame) {
                this.frameX++;
            } else {
                this.frameX = 0;
            }

            // power up
            if (this.powerUp) {
                if (this.powerUpTimer > this.powerUpLimit) {
                    this.powerUp = false;
                    this.powerUpTimer = 0;
                    this.frameY = 1;
                } else {
                    this.powerUpTimer += deltaTime;
                    this.frameY = 1;
                    this.game.ammo += 0.15;
                }
            }
        }
        draw(context) {
            if (this.game.debug)
                context.strokeRect(this.x, this.y, this.width, this.height);
            this.projectiles.forEach(projectile => {
                projectile.draw(context);
            });
            context.drawImage(
                this.image,
                this.frameX * this.width,
                this.frameY * this.height,
                this.width,
                this.height,
                this.x,
                this.y,
                this.width,
                this.height
            );
        }
        shootTop() {
            if (this.game.ammo > 0 && !this.game.gameOver && !this.game.levelCompleted) {
                this.projectiles.push(
                    new Projectile(this.game, this.x + 80, this.y + 30)
                );
                this.game.ammo--;
                if (this.game.sound) this.game.sound.playShot();
            }
            if (this.powerUp) this.shootBottom();
        }
        shootBottom() {
            if (this.game.ammo > 0 && !this.game.gameOver && !this.game.levelCompleted) {
                this.projectiles.push(
                    new Projectile(this.game, this.x + 80, this.y + 175)
                );
                this.game.ammo--;
            }
        }
        enterPowerUp() {
            this.powerUp = true;
            this.powerUpTimer = 0;
            if (this.game.ammo < this.game.maxAmmo) this.game.ammo = this.game.maxAmmo;
            if (this.game.sound) this.game.sound.playPowerup();
        }
    }

    class Enemy {
        constructor(game) {
            this.game = game;
            this.x = this.game.width;
            this.speedX = (Math.random() * -1.8 - 1.0) * this.game.currentLevelConfig.speedModifier;
            this.markedForDeletion = false;
            this.hasEscaped = false;
            this.frameX = 0;
            this.frameY = 0;
            this.maxFrame = 37;
            this.escapeDamage = 15;
        }
        update() {
            this.x += this.speedX - this.game.speed;
            
            // Check if fish breaches left defense line
            if (this.x < -40 && !this.hasEscaped) {
                this.hasEscaped = true;
                this.onEscape();
            }

            if (this.x + this.width < 0) {
                this.markedForDeletion = true;
            }

            // sprite animation
            if (this.frameX < this.maxFrame) {
                this.frameX++;
            } else {
                this.frameX = 0;
            }
        }
        onEscape() {
            if (this.type === 'lucky') return;
            
            this.game.escapedCount++;
            this.game.health = Math.max(0, this.game.health - this.escapeDamage);
            this.game.triggerShake(8, 250);
            if (this.game.sound) this.game.sound.playAlarm();
            this.game.floatingTexts.push(
                new FloatingText(`ESCAPED! -${this.escapeDamage} HP`, 15, Math.max(40, this.y + 30), '#ff3344')
            );
            if (this.game.health <= 0 && !this.game.gameOver) {
                this.game.gameOverReason = `LEVEL ${this.game.currentLevelIndex + 1} DEFENSE BREACHED!`;
                this.game.gameOver = true;
                if (this.game.sound) this.game.sound.playDefeat();
            }
        }
        draw(context) {
            if (this.game.debug)
                context.strokeRect(this.x, this.y, this.width, this.height);
            context.drawImage(
                this.image,
                this.frameX * this.width,
                this.frameY * this.height,
                this.width,
                this.height,
                this.x,
                this.y,
                this.width,
                this.height
            );
            if (this.game.debug) {
                context.font = '20px Helvetica';
                context.fillStyle = 'yellow';
                context.fillText(this.lives, this.x, this.y);
            }
        }
    }

    class Angler1 extends Enemy {
        constructor(game) {
            super(game);
            this.width = 228;
            this.height = 169;
            this.y = Math.random() * (this.game.height * 0.95 - this.height);
            this.image = document.getElementById('angler1');
            this.frameY = Math.floor(Math.random() * 3);
            this.lives = 5;
            this.score = this.lives;
            this.escapeDamage = 15;
        }
    }

    class Angler2 extends Enemy {
        constructor(game) {
            super(game);
            this.width = 213;
            this.height = 165;
            this.y = Math.random() * (this.game.height * 0.95 - this.height);
            this.image = document.getElementById('angler2');
            this.frameY = Math.floor(Math.random() * 2);
            this.lives = 6;
            this.score = this.lives;
            this.escapeDamage = 15;
        }
    }

    class LuckyFish extends Enemy {
        constructor(game) {
            super(game);
            this.width = 99;
            this.height = 95;
            this.y = Math.random() * (this.game.height * 0.95 - this.height);
            this.image = document.getElementById('lucky');
            this.frameY = Math.floor(Math.random() * 2);
            this.lives = 5;
            this.score = 15;
            this.type = 'lucky';
            this.escapeDamage = 0;
        }
    }

    class HiveWhale extends Enemy {
        constructor(game) {
            super(game);
            this.width = 400;
            this.height = 227;
            this.y = Math.random() * (this.game.height * 0.9 - this.height);
            this.image = document.getElementById('hivewhale');
            this.frameY = 0;
            this.lives = 20;
            this.score = this.lives;
            this.type = 'hive';
            this.speedX = (Math.random() * -1.2 - 0.3) * this.game.currentLevelConfig.speedModifier;
            this.escapeDamage = 35;
        }
    }

    class Drone extends Enemy {
        constructor(game, x, y) {
            super(game);
            this.width = 115;
            this.height = 95;
            this.x = x;
            this.y = y;
            this.image = document.getElementById('drone');
            this.frameY = Math.floor(Math.random() * 2);
            this.lives = 3;
            this.score = this.lives;
            this.type = 'drone';
            this.speedX = (Math.random() * -4.2 - 0.5) * this.game.currentLevelConfig.speedModifier;
            this.escapeDamage = 10;
        }
    }

    class Layer {
        constructor(game, image, speedModifier) {
            this.game = game;
            this.image = image;
            this.speedModifier = speedModifier;
            this.width = 1768;
            this.height = 500;
            this.x = 0;
            this.y = 0;
        }
        update() {
            if (this.x <= -this.width) this.x = 0;
            this.x -= this.game.speed * this.speedModifier;
        }
        draw(context) {
            context.drawImage(this.image, this.x, this.y, this.width, this.height);
            context.drawImage(
                this.image,
                this.x + this.width,
                this.y,
                this.width,
                this.height
            );
        }
    }

    class Background {
        constructor(game) {
            this.game = game;
            this.image1 = document.getElementById('layer1');
            this.image2 = document.getElementById('layer2');
            this.image3 = document.getElementById('layer3');
            this.image4 = document.getElementById('layer4');
            this.layer1 = new Layer(this.game, this.image1, 0.2);
            this.layer2 = new Layer(this.game, this.image2, 0.4);
            this.layer3 = new Layer(this.game, this.image3, 1);
            this.layer4 = new Layer(this.game, this.image4, 1.5);
            this.layers = [this.layer1, this.layer2, this.layer3];
        }
        update() {
            this.layers.forEach(layer => layer.update());
            this.layer4.update();
        }
        draw(context) {
            this.layers.forEach(layer => layer.draw(context));
        }
    }

    class Explosion {
        constructor(game, x, y) {
            this.game = game;
            this.frameX = 0;
            this.frameY = 0;
            this.spriteWidth = 200;
            this.spriteHeight = 200;
            this.width = this.spriteWidth;
            this.height = this.spriteHeight;
            this.x = x - this.width * 0.5;
            this.y = y - this.height * 0.5;
            this.fps = 30;
            this.timer = 0;
            this.interval = 1000 / this.fps;
            this.markedForDeletion = false;
            this.maxFrame = 8;
        }
        update(deltaTime) {
            this.x -= this.game.speed;
            if (this.timer > this.interval) {
                this.frameX++;
                this.timer = 0;
            } else {
                this.timer += deltaTime;
            }
            if (this.frameX > this.maxFrame) this.markedForDeletion = true;
        }
        draw(context) {
            context.drawImage(
                this.image,
                this.frameX * this.spriteWidth,
                this.frameY * this.spriteHeight,
                this.spriteWidth,
                this.spriteHeight,
                this.x,
                this.y,
                this.width,
                this.height
            );
        }
    }

    class SmokeExplosion extends Explosion {
        constructor(game, x, y) {
            super(game, x, y);
            this.image = document.getElementById('smokeExplosion');
        }
    }

    class FireExplosion extends Explosion {
        constructor(game, x, y) {
            super(game, x, y);
            this.image = document.getElementById('fireExplosion');
        }
    }

    // ── Enhanced HUD Panel ──
    class UI {
        constructor(game) {
            this.game = game;
            this.fontSize = 24;
            this.fontFamily = 'Bangers';
            this.accentFont = 'Orbitron';
            this.color = 'white';
            this.overlayAlpha = 0;
            this.overlayPulse = 0;
        }
        draw(context) {
            context.save();

            // ── HUD Panel Backdrop ──
            const panelGrad = context.createLinearGradient(0, 0, 540, 115);
            panelGrad.addColorStop(0, 'rgba(0, 12, 35, 0.85)');
            panelGrad.addColorStop(1, 'rgba(0, 12, 35, 0.25)');
            context.fillStyle = panelGrad;
            context.beginPath();
            context.roundRect(12, 10, 530, 105, 10);
            context.fill();
            context.strokeStyle = 'rgba(80, 200, 255, 0.45)';
            context.lineWidth = 1.5;
            context.stroke();

            // ── Score ──
            context.font = '11px ' + this.accentFont;
            context.fillStyle = 'rgba(180, 220, 255, 0.75)';
            context.fillText('SCORE', 24, 28);
            context.font = 'bold 26px ' + this.accentFont;
            context.fillStyle = '#ffffff';
            context.fillText(Math.floor(this.game.score), 24, 55);

            // ── Level Badge ──
            context.font = '11px ' + this.accentFont;
            context.fillStyle = 'rgba(180, 220, 255, 0.75)';
            context.fillText('LEVEL', 125, 28);
            context.font = 'bold 24px ' + this.accentFont;
            context.fillStyle = '#ffd700';
            context.fillText(`${this.game.currentLevelIndex + 1}`, 125, 54);

            // Level Name
            context.font = 'bold 11px ' + this.accentFont;
            context.fillStyle = '#6ee7ff';
            context.fillText(this.game.currentLevelConfig.name.toUpperCase(), 125, 72);

            // Target Score
            context.font = '10px ' + this.accentFont;
            context.fillStyle = 'rgba(200, 255, 220, 0.8)';
            context.fillText(`TARGET: ${this.game.currentLevelConfig.targetScore} PTS`, 125, 87);

            // ── Health / Base Shield Bar ──
            context.font = '11px ' + this.accentFont;
            context.fillStyle = 'rgba(180, 220, 255, 0.75)';
            context.fillText('HEALTH / SHIELD', 285, 28);

            const hpBarWidth = 230;
            const hpBarHeight = 12;
            const hpX = 285;
            const hpY = 38;
            const hpRatio = Math.max(0, this.game.health / this.game.maxHealth);

            context.fillStyle = 'rgba(255, 255, 255, 0.1)';
            context.beginPath();
            context.roundRect(hpX, hpY, hpBarWidth, hpBarHeight, 5);
            context.fill();

            if (hpRatio > 0) {
                const hpGrad = context.createLinearGradient(hpX, 0, hpX + hpBarWidth * hpRatio, 0);
                if (hpRatio > 0.5) {
                    hpGrad.addColorStop(0, '#00ffaa');
                    hpGrad.addColorStop(1, '#00cc66');
                } else if (hpRatio > 0.25) {
                    hpGrad.addColorStop(0, '#ffbb00');
                    hpGrad.addColorStop(1, '#ff8800');
                } else {
                    hpGrad.addColorStop(0, '#ff3344');
                    hpGrad.addColorStop(1, '#cc0022');
                }
                context.fillStyle = hpGrad;
                context.beginPath();
                context.roundRect(hpX, hpY, hpBarWidth * hpRatio, hpBarHeight, 5);
                context.fill();
            }
            context.font = '11px ' + this.accentFont;
            context.fillStyle = '#ffffff';
            context.fillText(`${Math.ceil(this.game.health)}%`, hpX + hpBarWidth - 35, hpY - 3);

            // ── Ammo Bar ──
            context.font = '11px ' + this.accentFont;
            context.fillStyle = 'rgba(180, 220, 255, 0.75)';
            context.fillText('AMMO', 24, 78);

            const ammoBarWidth = 90;
            const ammoBarHeight = 10;
            const ammoX = 24;
            const ammoY = 85;
            const ammoRatio = Math.min(this.game.ammo / this.game.maxAmmo, 1);

            context.fillStyle = 'rgba(255, 255, 255, 0.1)';
            context.beginPath();
            context.roundRect(ammoX, ammoY, ammoBarWidth, ammoBarHeight, 5);
            context.fill();

            if (ammoRatio > 0) {
                const ammoGrad = context.createLinearGradient(ammoX, 0, ammoX + ammoBarWidth * ammoRatio, 0);
                if (this.game.player.powerUp) {
                    ammoGrad.addColorStop(0, '#ffdd00');
                    ammoGrad.addColorStop(1, '#ff8800');
                } else {
                    ammoGrad.addColorStop(0, '#00c8ff');
                    ammoGrad.addColorStop(1, '#0066ff');
                }
                context.fillStyle = ammoGrad;
                context.beginPath();
                context.roundRect(ammoX, ammoY, ammoBarWidth * ammoRatio, ammoBarHeight, 5);
                context.fill();
            }

            // ── Escaped Counter ──
            context.font = '11px ' + this.accentFont;
            context.fillStyle = 'rgba(255, 120, 120, 0.85)';
            context.fillText(`ESCAPED: ${this.game.escapedCount}`, 285, 95);

            // ── Timer Bar (bottom of screen) ──
            const timeRatio = Math.max(0, 1 - this.game.gameTime / this.game.currentLevelConfig.timeLimit);
            const timerWidth = this.game.width - 40;
            const timerHeight = 8;
            const timerX = 20;
            const timerY = this.game.height - 18;

            context.fillStyle = 'rgba(255, 255, 255, 0.08)';
            context.beginPath();
            context.roundRect(timerX, timerY, timerWidth, timerHeight, 4);
            context.fill();

            if (timeRatio > 0) {
                const timerGrad = context.createLinearGradient(timerX, 0, timerX + timerWidth * timeRatio, 0);
                if (timeRatio > 0.3) {
                    timerGrad.addColorStop(0, '#00ffa0');
                    timerGrad.addColorStop(1, '#00cc88');
                } else {
                    timerGrad.addColorStop(0, '#ff4444');
                    timerGrad.addColorStop(1, '#ff8800');
                }
                context.fillStyle = timerGrad;
                context.beginPath();
                context.roundRect(timerX, timerY, timerWidth * timeRatio, timerHeight, 4);
                context.fill();
            }

            const timeLeft = Math.max(0, (this.game.currentLevelConfig.timeLimit - this.game.gameTime) * 0.001).toFixed(1);
            context.font = '13px ' + this.accentFont;
            context.fillStyle = timeRatio > 0.3 ? 'rgba(200, 255, 230, 0.8)' : 'rgba(255, 150, 130, 0.9)';
            context.textAlign = 'right';
            context.fillText(timeLeft + 's', timerX + timerWidth, timerY - 4);
            context.textAlign = 'left';

            // ── LEVEL INTERMISSION / LEVEL COMPLETE OVERLAY ──
            if (this.game.levelCompleted && !this.game.gameOver) {
                this.overlayAlpha = Math.min(1, this.overlayAlpha + 0.04);
                this.overlayPulse += 0.05;

                context.save();
                context.globalAlpha = this.overlayAlpha;

                // Dark glowing backdrop
                context.fillStyle = 'rgba(0, 12, 35, 0.85)';
                context.fillRect(0, 0, this.game.width, this.game.height);

                context.textAlign = 'center';

                // Stars rating based on health
                let stars = '⭐⭐⭐';
                if (this.game.health < 40) stars = '⭐';
                else if (this.game.health < 75) stars = '⭐⭐';

                context.shadowColor = 'rgba(0, 255, 200, 0.8)';
                context.shadowBlur = 25 + Math.sin(this.overlayPulse) * 10;
                context.font = '70px ' + this.fontFamily;
                context.fillStyle = '#00ffc8';
                context.fillText(`LEVEL ${this.game.currentLevelIndex + 1} COMPLETE!`, this.game.width * 0.5, this.game.height * 0.5 - 65);

                context.shadowBlur = 0;
                context.font = 'bold 36px ' + this.accentFont;
                context.fillStyle = '#ffd700';
                context.fillText(stars, this.game.width * 0.5, this.game.height * 0.5 - 15);

                context.font = '22px ' + this.accentFont;
                context.fillStyle = 'rgba(210, 230, 255, 0.9)';
                context.fillText(`Sector '${this.game.currentLevelConfig.name}' Cleared!`, this.game.width * 0.5, this.game.height * 0.5 + 25);

                context.font = 'bold 16px ' + this.accentFont;
                context.fillStyle = 'rgba(160, 210, 255, 0.8)';
                context.fillText(
                    `Score: ${Math.floor(this.game.score)}   |   Health: ${Math.ceil(this.game.health)}%   |   Escaped: ${this.game.escapedCount}`,
                    this.game.width * 0.5,
                    this.game.height * 0.5 + 60
                );

                // Prompt
                const promptAlpha = 0.5 + Math.sin(this.overlayPulse * 2) * 0.4;
                context.globalAlpha = this.overlayAlpha * promptAlpha;
                context.font = 'bold 18px ' + this.accentFont;
                context.fillStyle = '#ffffff';
                context.fillText(`[ Press ENTER to Start Level ${this.game.currentLevelIndex + 2} ]`, this.game.width * 0.5, this.game.height * 0.5 + 110);

                context.restore();
            }

            // ── Game Over Screen ──
            if (this.game.gameOver) {
                this.overlayAlpha = Math.min(1, this.overlayAlpha + 0.03);
                this.overlayPulse += 0.05;

                context.save();
                context.globalAlpha = this.overlayAlpha;

                context.fillStyle = 'rgba(0, 8, 24, 0.85)';
                context.fillRect(0, 0, this.game.width, this.game.height);

                context.textAlign = 'center';

                context.shadowColor = 'rgba(255, 60, 60, 0.8)';
                context.shadowBlur = 25 + Math.sin(this.overlayPulse) * 10;
                context.font = '75px ' + this.fontFamily;
                context.fillStyle = '#ff5555';
                context.fillText('DEFEAT — MISSION FAILED!', this.game.width * 0.5, this.game.height * 0.5 - 55);

                context.shadowBlur = 0;
                context.font = '22px ' + this.accentFont;
                context.fillStyle = 'rgba(210, 230, 255, 0.9)';
                context.fillText(this.game.gameOverReason || `Submarine Destroyed on Level ${this.game.currentLevelIndex + 1}`, this.game.width * 0.5, this.game.height * 0.5 + 5);

                // Stats breakdown
                context.font = 'bold 18px ' + this.accentFont;
                context.fillStyle = 'rgba(160, 210, 255, 0.8)';
                context.fillText(
                    `Final Score: ${Math.floor(this.game.score)}   |   Level Reached: ${this.game.currentLevelIndex + 1}   |   Escaped Fish: ${this.game.escapedCount}`,
                    this.game.width * 0.5,
                    this.game.height * 0.5 + 50
                );

                // Restart prompt
                const restartAlpha = 0.5 + Math.sin(this.overlayPulse * 2) * 0.4;
                context.globalAlpha = this.overlayAlpha * restartAlpha;
                context.font = '18px ' + this.accentFont;
                context.fillStyle = '#ffffff';
                context.fillText(
                    '[ Press ENTER to Restart Campaign ]',
                    this.game.width * 0.5,
                    this.game.height * 0.5 + 105
                );

                context.restore();
            }

            context.restore();
        }
    }

    class Game {
        constructor(width, height) {
            this.width = width;
            this.height = height;
            this.sound = new SoundController();
            this.background = new Background(this);
            this.ui = new UI(this);
            this.keys = [];
            this.enemies = [];
            this.particles = [];
            this.explosions = [];
            this.floatingTexts = [];
            
            // Level Campaign Management
            this.currentLevelIndex = 0;
            this.currentLevelConfig = getLevelConfig(0);
            this.levelCompleted = false;
            this.allLevelsBeaten = false;

            this.enemyTimer = 0;
            this.enemyInterval = this.currentLevelConfig.enemyInterval;
            this.ammo = 20;
            this.maxAmmo = 50;
            this.ammoTimer = 0;
            this.ammoInterval = 320;
            this.player = new Player(this);
            this.input = new InputHandler(this);
            this.gameOver = false;
            this.gameOverReason = '';
            this.score = 0;
            this.health = 100;
            this.maxHealth = 100;
            this.escapedCount = 0;
            this.gameTime = 0;
            this.speed = 1;
            this.debug = false;
            this.maxParticles = 200;

            // Screen shake
            this.shakeIntensity = 0;
            this.shakeTimer = 0;

            this.floatingTexts.push(
                new FloatingText(`LEVEL 1: ${this.currentLevelConfig.name.toUpperCase()}`, this.width * 0.3, 220, '#6ee7ff', 32)
            );
        }

        update(deltaTime) {
            if (!this.gameOver && !this.levelCompleted) {
                this.gameTime += deltaTime;
            }

            // Check Level Completion Target
            if (this.score >= this.currentLevelConfig.targetScore && !this.levelCompleted && !this.gameOver) {
                this.triggerLevelComplete();
            }

            // Check Time Limit Expiration
            if (this.gameTime >= this.currentLevelConfig.timeLimit && !this.gameOver && !this.levelCompleted) {
                if (this.score >= this.currentLevelConfig.targetScore * 0.7 && this.health > 0) {
                    // Time up but score sufficient -> Level cleared!
                    this.triggerLevelComplete();
                } else if (this.health <= 0) {
                    this.gameOverReason = `DEFENSE BREACHED ON LEVEL ${this.currentLevelIndex + 1}!`;
                    this.gameOver = true;
                    if (this.sound) this.sound.playDefeat();
                } else {
                    this.gameOverReason = `TIME EXPIRED ON LEVEL ${this.currentLevelIndex + 1}! (TARGET NOT MET)`;
                    this.gameOver = true;
                    if (this.sound) this.sound.playDefeat();
                }
            }

            this.background.update();
            this.player.update(deltaTime);

            if (this.levelCompleted || this.gameOver) return;

            // Ammo regeneration
            if (this.ammoTimer > this.ammoInterval) {
                if (this.ammo < this.maxAmmo) this.ammo++;
                this.ammoTimer = 0;
            } else {
                this.ammoTimer += deltaTime;
            }

            // Particles (capped)
            this.particles.forEach(particle => particle.update());
            this.particles = this.particles.filter(
                particle => !particle.markedForDeletion
            );
            if (this.particles.length > this.maxParticles) {
                this.particles.length = this.maxParticles;
            }

            this.explosions.forEach(explosion => explosion.update(deltaTime));
            this.explosions = this.explosions.filter(
                explosion => !explosion.markedForDeletion
            );

            // Floating combat texts
            this.floatingTexts.forEach(ft => ft.update(deltaTime));
            this.floatingTexts = this.floatingTexts.filter(ft => !ft.markedForDeletion);

            // Screen shake timer
            if (this.shakeTimer > 0) {
                this.shakeTimer -= deltaTime;
                if (this.shakeTimer <= 0) {
                    this.shakeIntensity = 0;
                    this.shakeTimer = 0;
                }
            }

            // Enemies & Collisions
            this.enemies.forEach(enemy => {
                enemy.update();

                // Player Direct Collision
                if (this.checkCollision(this.player, enemy)) {
                    enemy.markedForDeletion = true;
                    this.addExplosion(enemy);
                    for (let i = 0; i < 8; i++) {
                        this.particles.push(
                            new Particle(
                                this,
                                enemy.x + enemy.width * 0.5,
                                enemy.y + enemy.height * 0.5
                            )
                        );
                    }
                    if (enemy.type === 'lucky') {
                        this.player.enterPowerUp();
                        this.health = Math.min(this.maxHealth, this.health + 25);
                        this.floatingTexts.push(
                            new FloatingText('+25 HP REPAIR!', this.player.x + 100, this.player.y, '#00ffc8')
                        );
                    } else if (!this.gameOver && !this.levelCompleted) {
                        const directDamage = 20;
                        this.health = Math.max(0, this.health - directDamage);
                        this.score = Math.max(0, this.score - 1);
                        this.triggerShake(10, 300);
                        if (this.sound) this.sound.playHit();
                        this.floatingTexts.push(
                            new FloatingText(`-${directDamage} HP`, this.player.x + 100, this.player.y, '#ff3344')
                        );
                        if (this.health <= 0) {
                            this.gameOverReason = `SUBMARINE DESTROYED ON LEVEL ${this.currentLevelIndex + 1}!`;
                            this.gameOver = true;
                            if (this.sound) this.sound.playDefeat();
                        }
                    }
                }

                // Projectiles vs Enemies Collision
                this.player.projectiles.forEach(projectile => {
                    if (this.checkCollision(projectile, enemy)) {
                        enemy.lives--;
                        projectile.markedForDeletion = true;
                        this.particles.push(
                            new Particle(
                                this,
                                enemy.x + enemy.width * 0.5,
                                enemy.y + enemy.height * 0.5
                            )
                        );
                        if (enemy.lives <= 0) {
                            for (let i = 0; i < enemy.score; i++) {
                                this.particles.push(
                                    new Particle(
                                        this,
                                        enemy.x + enemy.width * 0.5,
                                        enemy.y + enemy.height * 0.5
                                    )
                                );
                            }
                            enemy.markedForDeletion = true;
                            this.addExplosion(enemy);
                            if (this.sound) this.sound.playExplosion();
                            if (enemy.type === 'hive') {
                                for (let i = 0; i < 5; i++) {
                                    this.enemies.push(
                                        new Drone(
                                            this,
                                            enemy.x + Math.random() * enemy.width,
                                            enemy.y + Math.random() * enemy.height * 0.5
                                        )
                                    );
                                }
                            }

                            if (!this.gameOver && !this.levelCompleted) {
                                this.score += enemy.score;
                                this.floatingTexts.push(
                                    new FloatingText(
                                        `+${enemy.score}`,
                                        enemy.x + enemy.width * 0.4,
                                        enemy.y,
                                        '#00ffc8'
                                    )
                                );
                            }
                        } else {
                            if (this.sound) this.sound.playHit();
                        }
                    }
                });
            });

            this.enemies = this.enemies.filter(enemy => !enemy.markedForDeletion);

            // Enemy Spawning
            if (this.enemyTimer > this.enemyInterval && !this.gameOver && !this.levelCompleted) {
                this.addEnemy();
                this.enemyTimer = 0;
            } else {
                this.enemyTimer += deltaTime;
            }
        }

        draw(context) {
            context.save();
            
            // Screen shake translation
            if (this.shakeTimer > 0) {
                const dx = (Math.random() - 0.5) * this.shakeIntensity * 2;
                const dy = (Math.random() - 0.5) * this.shakeIntensity * 2;
                context.translate(dx, dy);
            }

            this.background.draw(context);
            this.player.draw(context);
            this.particles.forEach(particle => particle.draw(context));
            this.enemies.forEach(enemy => enemy.draw(context));
            this.explosions.forEach(explosion => explosion.draw(context));
            this.floatingTexts.forEach(ft => ft.draw(context));
            
            // Foreground layer
            this.background.layer4.draw(context);
            this.ui.draw(context);

            context.restore();
        }

        triggerLevelComplete() {
            this.levelCompleted = true;
            this.ui.overlayAlpha = 0;
            this.ui.overlayPulse = 0;
            if (this.sound) this.sound.playVictory();
        }

        nextLevel() {
            this.currentLevelIndex++;
            this.currentLevelConfig = getLevelConfig(this.currentLevelIndex);
            this.levelCompleted = false;
            this.gameTime = 0;
            this.enemyTimer = 0;
            this.enemyInterval = this.currentLevelConfig.enemyInterval;
            this.enemies = [];
            this.player.projectiles = [];
            if (this.sound) this.sound.playPowerup();
            
            // Reward player on level advance: +35 HP repair & full ammo!
            this.health = Math.min(this.maxHealth, this.health + 35);
            this.ammo = this.maxAmmo;
            
            this.floatingTexts.push(
                new FloatingText(`LEVEL ${this.currentLevelIndex + 1}: ${this.currentLevelConfig.name.toUpperCase()}`, this.width * 0.22, 220, '#6ee7ff', 32)
            );
        }

        addEnemy() {
            const pool = this.currentLevelConfig.unlockedEnemies;
            const chosenType = pool[Math.floor(Math.random() * pool.length)];

            if (chosenType === 'angler1') this.enemies.push(new Angler1(this));
            else if (chosenType === 'angler2') this.enemies.push(new Angler2(this));
            else if (chosenType === 'hive') this.enemies.push(new HiveWhale(this));
            else if (chosenType === 'drone') this.enemies.push(new Drone(this, this.width, Math.random() * (this.height * 0.8)));
            else if (chosenType === 'lucky') this.enemies.push(new LuckyFish(this));
        }

        addExplosion(enemy) {
            const randomize = Math.random();
            if (randomize < 0.5) {
                this.explosions.push(
                    new SmokeExplosion(
                        this,
                        enemy.x + enemy.width * 0.5,
                        enemy.y + enemy.height * 0.5
                    )
                );
            } else {
                this.explosions.push(
                    new FireExplosion(
                        this,
                        enemy.x + enemy.width * 0.5,
                        enemy.y + enemy.height * 0.5
                    )
                );
            }
        }

        checkCollision(rect1, rect2) {
            return (
                rect1.x < rect2.x + rect2.width &&
                rect1.x + rect1.width > rect2.x &&
                rect1.y < rect2.y + rect2.height &&
                rect1.y + rect1.height > rect2.y
            );
        }

        triggerShake(intensity, duration) {
            this.shakeIntensity = intensity;
            this.shakeTimer = duration;
        }

        restart() {
            this.currentLevelIndex = 0;
            this.currentLevelConfig = getLevelConfig(0);
            this.levelCompleted = false;
            this.allLevelsBeaten = false;
            
            this.enemies = [];
            this.particles = [];
            this.explosions = [];
            this.floatingTexts = [];
            this.player.projectiles = [];
            this.player.x = 20;
            this.player.y = 100;
            this.player.powerUp = false;
            this.player.powerUpTimer = 0;
            this.player.frameY = 1;
            
            this.ammo = 20;
            this.ammoTimer = 0;
            this.enemyTimer = 0;
            this.enemyInterval = this.currentLevelConfig.enemyInterval;
            
            this.gameOver = false;
            this.gameOverReason = '';
            this.score = 0;
            this.health = 100;
            this.escapedCount = 0;
            this.gameTime = 0;
            
            this.shakeIntensity = 0;
            this.shakeTimer = 0;
            this.ui.overlayAlpha = 0;
            this.ui.overlayPulse = 0;

            this.floatingTexts.push(
                new FloatingText(`LEVEL 1: ${this.currentLevelConfig.name.toUpperCase()}`, this.width * 0.3, 220, '#6ee7ff', 32)
            );
        }
    }

    const game = new Game(canvas.width, canvas.height);
    let lastTime = 0;

    function animate(timeStamp) {
        const deltaTime = timeStamp - lastTime;
        lastTime = timeStamp;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        game.update(deltaTime);
        game.draw(ctx);
        requestAnimationFrame(animate);
    }
    animate(0);
});
