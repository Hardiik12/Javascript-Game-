window.addEventListener('load', function () {
    // canvas setup
    const canvas = document.getElementById('canvas1');
    const ctx = canvas.getContext('2d');
    canvas.width = 1500;
    canvas.height = 500;

    class InputHandler {
        constructor(game) {
            this.game = game;
            window.addEventListener('keydown', e => {
                if (
                    (e.key === 'ArrowUp' || e.key === 'ArrowDown') &&
                    this.game.keys.indexOf(e.key) === -1
                ) {
                    this.game.keys.push(e.key);
                } else if (e.key === ' ') {
                    this.game.player.shootTop();
                } else if (e.key === 'd') {
                    this.game.debug = !this.game.debug;
                } else if (e.key === 'Enter' && this.game.gameOver) {
                    this.game.restart();
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
            this.speed = 3;
            this.markedForDeletion = false;
            this.image = document.getElementById('projectile');
        }
        update() {
            this.x += this.speed;
            if (this.x > this.game.width * 0.8) this.markedForDeletion = true;
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

    // ── Floating Score Number ──
    class FloatingText {
        constructor(value, x, y) {
            this.value = value;
            this.x = x;
            this.y = y;
            this.markedForDeletion = false;
            this.timer = 0;
            this.lifeSpan = 1500;
            this.speedY = -1.5;
            this.opacity = 1;
        }
        update(deltaTime) {
            this.y += this.speedY;
            this.timer += deltaTime;
            if (this.timer > this.lifeSpan * 0.5) {
                this.opacity -= 0.02;
            }
            if (this.timer > this.lifeSpan) this.markedForDeletion = true;
        }
        draw(context) {
            context.save();
            context.globalAlpha = Math.max(0, this.opacity);
            context.font = 'bold 28px Orbitron';
            const text = (this.value > 0 ? '+' : '') + this.value;
            // glow
            context.shadowColor = this.value > 0 ? '#00ffaa' : '#ff4444';
            context.shadowBlur = 12;
            context.fillStyle = this.value > 0 ? '#00ffc8' : '#ff6666';
            context.fillText(text, this.x, this.y);
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
            this.maxSpeed = 3;
            this.projectiles = [];
            this.image = document.getElementById('player');
            this.powerUp = false;
            this.powerUpTimer = 0;
            this.powerUpLimit = 10000;
        }
        update(deltaTime) {
            if (this.game.keys.includes('ArrowUp')) this.speedY = -this.maxSpeed;
            else if (this.game.keys.includes('ArrowDown'))
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
                    this.frameY = 1; // FIX: was 0, but normal state is row 1
                } else {
                    this.powerUpTimer += deltaTime;
                    this.frameY = 1;
                    this.game.ammo += 0.1;
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
            if (this.game.ammo > 0) {
                this.projectiles.push(
                    new Projectile(this.game, this.x + 80, this.y + 30)
                );
                this.game.ammo--;
            }
            if (this.powerUp) this.shootBottom();
        }
        shootBottom() {
            if (this.game.ammo > 0) {
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
        }
    }

    class Enemy {
        constructor(game) {
            this.game = game;
            this.x = this.game.width;
            this.speedX = Math.random() * -1.5 - 0.5;
            this.markedForDeletion = false;
            this.frameX = 0;
            this.frameY = 0;
            this.maxFrame = 37;
        }
        update() {
            this.x += this.speedX - this.game.speed;
            if (this.x + this.width < 0) this.markedForDeletion = true;
            // sprite animation
            if (this.frameX < this.maxFrame) {
                this.frameX++;
            } else {
                this.frameX = 0;
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
            this.speedX = Math.random() * -1.2 - 0.2;
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
            this.speedX = Math.random() * -4.2 - 0.5;
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
            // layer4 is drawn in Game.draw so it can be truly in the foreground
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

    // ── Enhanced UI ──
    class UI {
        constructor(game) {
            this.game = game;
            this.fontSize = 25;
            this.fontFamily = 'Bangers';
            this.accentFont = 'Orbitron';
            this.color = 'white';
            this.gameOverAlpha = 0;
            this.gameOverPulse = 0;
        }
        draw(context) {
            context.save();

            // ── HUD Panel Backdrop ──
            const panelGrad = context.createLinearGradient(0, 0, 300, 120);
            panelGrad.addColorStop(0, 'rgba(0, 10, 30, 0.65)');
            panelGrad.addColorStop(1, 'rgba(0, 10, 30, 0.1)');
            context.fillStyle = panelGrad;
            context.beginPath();
            context.roundRect(10, 8, 280, 108, 10);
            context.fill();
            // subtle border
            context.strokeStyle = 'rgba(80, 180, 255, 0.25)';
            context.lineWidth = 1;
            context.stroke();

            // ── Score ──
            context.fillStyle = this.color;
            context.shadowOffsetX = 1;
            context.shadowOffsetY = 1;
            context.shadowColor = 'rgba(0,0,0,0.6)';
            context.font = '14px ' + this.accentFont;
            context.fillStyle = 'rgba(180, 210, 255, 0.7)';
            context.fillText('SCORE', 22, 30);
            context.font = 'bold 30px ' + this.accentFont;
            context.fillStyle = '#ffffff';
            context.fillText(Math.floor(this.game.score), 22, 60);

            // ── Wave Counter ──
            context.font = '14px ' + this.accentFont;
            context.fillStyle = 'rgba(180, 210, 255, 0.7)';
            context.fillText('WAVE', 180, 30);
            context.font = 'bold 24px ' + this.accentFont;
            context.fillStyle = '#6ee7ff';
            context.fillText(this.game.wave, 180, 56);

            // ── Ammo Bar ──
            context.font = '12px ' + this.accentFont;
            context.fillStyle = 'rgba(180, 210, 255, 0.5)';
            context.fillText('AMMO', 22, 82);

            const ammoBarWidth = 200;
            const ammoBarHeight = 10;
            const ammoX = 22;
            const ammoY = 88;
            const ammoRatio = Math.min(this.game.ammo / this.game.maxAmmo, 1);

            // bar background
            context.fillStyle = 'rgba(255, 255, 255, 0.08)';
            context.beginPath();
            context.roundRect(ammoX, ammoY, ammoBarWidth, ammoBarHeight, 5);
            context.fill();

            // bar fill with gradient
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

                // glow on ammo bar
                context.shadowColor = this.game.player.powerUp ? 'rgba(255, 200, 0, 0.5)' : 'rgba(0, 150, 255, 0.4)';
                context.shadowBlur = 8;
                context.fill();
                context.shadowBlur = 0;
            }

            // ── Timer Bar (top of screen) ──
            const timeRatio = Math.max(0, 1 - this.game.gameTime / this.game.timeLimit);
            const timerWidth = this.game.width - 40;
            const timerHeight = 6;
            const timerX = 20;
            const timerY = this.game.height - 16;

            // background
            context.fillStyle = 'rgba(255, 255, 255, 0.06)';
            context.beginPath();
            context.roundRect(timerX, timerY, timerWidth, timerHeight, 3);
            context.fill();

            // fill
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
                context.roundRect(timerX, timerY, timerWidth * timeRatio, timerHeight, 3);
                context.fill();
                // glow
                context.shadowColor = timeRatio > 0.3 ? 'rgba(0, 255, 160, 0.4)' : 'rgba(255, 80, 50, 0.5)';
                context.shadowBlur = 6;
                context.fill();
                context.shadowBlur = 0;
            }

            // time text
            context.shadowOffsetX = 0;
            context.shadowOffsetY = 0;
            const timeLeft = Math.max(0, (this.game.timeLimit - this.game.gameTime) * 0.001).toFixed(1);
            context.font = '13px ' + this.accentFont;
            context.fillStyle = timeRatio > 0.3 ? 'rgba(200, 255, 230, 0.6)' : 'rgba(255, 150, 130, 0.8)';
            context.textAlign = 'right';
            context.fillText(timeLeft + 's', timerX + timerWidth, timerY - 4);
            context.textAlign = 'left';

            // ── Game Over Screen ──
            if (this.game.gameOver) {
                this.gameOverAlpha = Math.min(1, this.gameOverAlpha + 0.02);
                this.gameOverPulse += 0.04;

                context.save();
                context.globalAlpha = this.gameOverAlpha;

                // dark overlay
                context.fillStyle = 'rgba(0, 5, 20, 0.75)';
                context.fillRect(0, 0, this.game.width, this.game.height);

                context.textAlign = 'center';

                const won = this.game.score >= this.game.winningScore;

                // main message with glow
                context.shadowColor = won ? 'rgba(0, 255, 180, 0.8)' : 'rgba(255, 60, 60, 0.8)';
                context.shadowBlur = 20 + Math.sin(this.gameOverPulse) * 8;
                context.font = '70px ' + this.fontFamily;
                context.fillStyle = won ? '#00ffc8' : '#ff6666';
                const message1 = won ? 'Most Wondrous!' : 'Blazes!';
                context.fillText(message1, this.game.width * 0.5, this.game.height * 0.5 - 50);

                // sub-message
                context.shadowBlur = 0;
                context.font = '22px ' + this.accentFont;
                context.fillStyle = 'rgba(200, 220, 255, 0.85)';
                const message2 = won ? 'Well done explorer!' : 'Better luck next time!';
                context.fillText(message2, this.game.width * 0.5, this.game.height * 0.5 + 10);

                // final score
                context.font = 'bold 18px ' + this.accentFont;
                context.fillStyle = 'rgba(150, 200, 255, 0.7)';
                context.fillText(
                    'Final Score: ' + Math.floor(this.game.score),
                    this.game.width * 0.5,
                    this.game.height * 0.5 + 50
                );

                // restart prompt — pulsing
                const restartAlpha = 0.5 + Math.sin(this.gameOverPulse * 2) * 0.3;
                context.globalAlpha = this.gameOverAlpha * restartAlpha;
                context.font = '16px ' + this.accentFont;
                context.fillStyle = '#ffffff';
                context.fillText(
                    '[ Press ENTER to Play Again ]',
                    this.game.width * 0.5,
                    this.game.height * 0.5 + 100
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
            this.background = new Background(this);
            this.ui = new UI(this);
            this.keys = [];
            this.enemies = [];
            this.particles = [];
            this.explosions = [];
            this.floatingTexts = [];
            this.enemyTimer = 0;
            this.enemyInterval = 2000;
            this.ammo = 20;
            this.maxAmmo = 50;
            this.ammoTimer = 0;
            this.ammoInterval = 350;
            this.player = new Player(this);
            this.input = new InputHandler(this);
            this.gameOver = false;
            this.score = 0;
            this.winningScore = 100;
            this.gameTime = 0;
            this.timeLimit = 30000;
            this.speed = 1;
            this.debug = false;
            this.maxParticles = 200;
            this.wave = 1;
            this.waveThreshold = 30;
            // screen shake
            this.shakeIntensity = 0;
            this.shakeDuration = 0;
            this.shakeTimer = 0;
        }
        update(deltaTime) {
            if (!this.gameOver) this.gameTime += deltaTime;
            if (this.gameTime > this.timeLimit) this.gameOver = true;
            this.background.update();
            this.player.update(deltaTime);

            // wave progression
            const newWave = Math.floor(this.score / this.waveThreshold) + 1;
            if (newWave > this.wave) {
                this.wave = newWave;
                // speed up enemy spawns slightly each wave
                this.enemyInterval = Math.max(500, 2000 - (this.wave - 1) * 150);
            }

            // ammo
            if (this.ammoTimer > this.ammoInterval) {
                if (this.ammo < this.maxAmmo) this.ammo++;
                this.ammoTimer = 0;
            } else {
                this.ammoTimer += deltaTime;
            }
            // particles (capped)
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

            // floating texts
            this.floatingTexts.forEach(ft => ft.update(deltaTime));
            this.floatingTexts = this.floatingTexts.filter(ft => !ft.markedForDeletion);

            // screen shake
            if (this.shakeTimer > 0) {
                this.shakeTimer -= deltaTime;
                if (this.shakeTimer <= 0) {
                    this.shakeIntensity = 0;
                    this.shakeTimer = 0;
                }
            }

            // enemies + collisions
            this.enemies.forEach(enemy => {
                enemy.update();
                if (this.checkCollision(this.player, enemy)) {
                    enemy.markedForDeletion = true;
                    this.addExplosion(enemy);
                    for (let i = 0; i < 10; i++) {
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
                    } else if (!this.gameOver) {
                        this.score--;
                        this.triggerShake(6, 300);
                        this.floatingTexts.push(
                            new FloatingText(-1, this.player.x + this.player.width, this.player.y)
                        );
                    }
                }
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

                            if (!this.gameOver) {
                                this.score += enemy.score;
                                this.floatingTexts.push(
                                    new FloatingText(
                                        enemy.score,
                                        enemy.x + enemy.width * 0.5,
                                        enemy.y
                                    )
                                );
                            }
                            // win condition
                            if (this.score >= this.winningScore)
                                this.gameOver = true;
                        }
                    }
                });
            });
            this.enemies = this.enemies.filter(enemy => !enemy.markedForDeletion);

            // enemy spawn
            if (this.enemyTimer > this.enemyInterval && !this.gameOver) {
                this.addEnemy();
                this.enemyTimer = 0;
            } else {
                this.enemyTimer += deltaTime;
            }
        }
        draw(context) {
            // screen shake
            context.save();
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
            // foreground layer
            this.background.layer4.draw(context);
            this.ui.draw(context);

            context.restore();
        }
        addEnemy() {
            const randomize = Math.random();
            if (randomize < 0.5) this.enemies.push(new Angler1(this));
            else if (randomize < 0.6) this.enemies.push(new Angler2(this));
            else if (randomize < 0.7) this.enemies.push(new HiveWhale(this));
            else this.enemies.push(new LuckyFish(this));
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
            this.shakeDuration = duration;
            this.shakeTimer = duration;
        }
        restart() {
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
            this.enemyInterval = 2000;
            this.gameOver = false;
            this.score = 0;
            this.gameTime = 0;
            this.wave = 1;
            this.shakeIntensity = 0;
            this.shakeTimer = 0;
            this.ui.gameOverAlpha = 0;
            this.ui.gameOverPulse = 0;
        }
    }

    const game = new Game(canvas.width, canvas.height);
    let lastTime = 0;

    // animation loop — FIX: update BEFORE draw
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
