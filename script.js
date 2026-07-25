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
                    (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'w' || e.key === 's') &&
                    this.game.keys.indexOf(e.key) === -1
                ) {
                    this.game.keys.push(e.key);
                } else if (e.key === ' ') {
                    this.game.player.shootTop();
                } else if (e.key === 'd' || e.key === 'D') {
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
            this.speed = 4;
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
        constructor(text, x, y, color = '#00ffc8') {
            this.text = text;
            this.x = x;
            this.y = y;
            this.color = color;
            this.markedForDeletion = false;
            this.timer = 0;
            this.lifeSpan = 1400;
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
            context.font = 'bold 24px Orbitron, sans-serif';
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
            this.maxSpeed = 4;
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
                    this.frameY = 1; // reset to normal frame Y
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
            if (this.game.ammo > 0 && !this.game.gameOver) {
                this.projectiles.push(
                    new Projectile(this.game, this.x + 80, this.y + 30)
                );
                this.game.ammo--;
            }
            if (this.powerUp) this.shootBottom();
        }
        shootBottom() {
            if (this.game.ammo > 0 && !this.game.gameOver) {
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
            this.speedX = Math.random() * -1.5 - 0.8;
            this.markedForDeletion = false;
            this.frameX = 0;
            this.frameY = 0;
            this.maxFrame = 37;
            this.escapeDamage = 15; // Damage dealt to player/base when fish escapes
        }
        update() {
            this.x += this.speedX - this.game.speed;
            
            // Check if fish escaped past left screen edge
            if (this.x + this.width < 0) {
                this.markedForDeletion = true;
                this.onEscape();
            }

            // sprite animation
            if (this.frameX < this.maxFrame) {
                this.frameX++;
            } else {
                this.frameX = 0;
            }
        }
        onEscape() {
            if (this.type === 'lucky') {
                // Lucky fish escapes peacefully without penalty
                return;
            }
            // Penalty for letting enemies breach defense line!
            this.game.escapedCount++;
            this.game.health = Math.max(0, this.game.health - this.escapeDamage);
            this.game.triggerShake(8, 250);
            this.game.floatingTexts.push(
                new FloatingText(`ESCAPED! -${this.escapeDamage} HP`, 15, Math.max(40, this.y + 30), '#ff3344')
            );
            if (this.game.health <= 0 && !this.game.gameOver) {
                this.game.gameOverReason = 'DEFENSE BREACHED! TOO MANY FISH ESCAPED!';
                this.game.gameOver = true;
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
            this.speedX = Math.random() * -1.2 - 0.3;
            this.escapeDamage = 35; // Heavy penalty if big whale breaches!
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
            this.gameOverAlpha = 0;
            this.gameOverPulse = 0;
        }
        draw(context) {
            context.save();

            // ── HUD Panel Backdrop ──
            const panelGrad = context.createLinearGradient(0, 0, 480, 115);
            panelGrad.addColorStop(0, 'rgba(0, 12, 35, 0.75)');
            panelGrad.addColorStop(1, 'rgba(0, 12, 35, 0.2)');
            context.fillStyle = panelGrad;
            context.beginPath();
            context.roundRect(12, 10, 460, 105, 10);
            context.fill();
            context.strokeStyle = 'rgba(80, 200, 255, 0.4)';
            context.lineWidth = 1.5;
            context.stroke();

            // ── Score ──
            context.font = '12px ' + this.accentFont;
            context.fillStyle = 'rgba(180, 220, 255, 0.75)';
            context.fillText('SCORE', 24, 30);
            context.font = 'bold 28px ' + this.accentFont;
            context.fillStyle = '#ffffff';
            context.fillText(Math.floor(this.game.score), 24, 58);

            // ── Wave ──
            context.font = '12px ' + this.accentFont;
            context.fillStyle = 'rgba(180, 220, 255, 0.75)';
            context.fillText('WAVE', 140, 30);
            context.font = 'bold 24px ' + this.accentFont;
            context.fillStyle = '#6ee7ff';
            context.fillText(this.game.wave, 140, 56);

            // ── Health / Base Shield Bar ──
            context.font = '12px ' + this.accentFont;
            context.fillStyle = 'rgba(180, 220, 255, 0.75)';
            context.fillText('HEALTH / SHIELD', 240, 30);

            const hpBarWidth = 210;
            const hpBarHeight = 12;
            const hpX = 240;
            const hpY = 40;
            const hpRatio = Math.max(0, this.game.health / this.game.maxHealth);

            // HP bar bg
            context.fillStyle = 'rgba(255, 255, 255, 0.1)';
            context.beginPath();
            context.roundRect(hpX, hpY, hpBarWidth, hpBarHeight, 5);
            context.fill();

            // HP bar fill
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
            context.font = '12px ' + this.accentFont;
            context.fillStyle = 'rgba(180, 220, 255, 0.75)';
            context.fillText('AMMO', 24, 80);

            const ammoBarWidth = 200;
            const ammoBarHeight = 10;
            const ammoX = 24;
            const ammoY = 88;
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
            context.font = '12px ' + this.accentFont;
            context.fillStyle = 'rgba(255, 120, 120, 0.85)';
            context.fillText(`ESCAPED: ${this.game.escapedCount}`, 240, 96);

            // ── Timer Bar (bottom of screen) ──
            const timeRatio = Math.max(0, 1 - this.game.gameTime / this.game.timeLimit);
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

            const timeLeft = Math.max(0, (this.game.timeLimit - this.game.gameTime) * 0.001).toFixed(1);
            context.font = '13px ' + this.accentFont;
            context.fillStyle = timeRatio > 0.3 ? 'rgba(200, 255, 230, 0.8)' : 'rgba(255, 150, 130, 0.9)';
            context.textAlign = 'right';
            context.fillText(timeLeft + 's', timerX + timerWidth, timerY - 4);
            context.textAlign = 'left';

            // ── Game Over Screen ──
            if (this.game.gameOver) {
                this.gameOverAlpha = Math.min(1, this.gameOverAlpha + 0.03);
                this.gameOverPulse += 0.05;

                context.save();
                context.globalAlpha = this.gameOverAlpha;

                // Dark blurred backdrop overlay
                context.fillStyle = 'rgba(0, 8, 24, 0.82)';
                context.fillRect(0, 0, this.game.width, this.game.height);

                context.textAlign = 'center';

                const won = this.game.score >= this.game.winningScore || (this.game.gameTime >= this.game.timeLimit && this.game.health > 0);

                context.shadowColor = won ? 'rgba(0, 255, 180, 0.8)' : 'rgba(255, 60, 60, 0.8)';
                context.shadowBlur = 25 + Math.sin(this.gameOverPulse) * 10;
                context.font = '75px ' + this.fontFamily;
                context.fillStyle = won ? '#00ffc8' : '#ff5555';
                const titleText = won ? 'VICTORY — SECTOR SECURED!' : 'DEFEAT — MISSION FAILED!';
                context.fillText(titleText, this.game.width * 0.5, this.game.height * 0.5 - 55);

                context.shadowBlur = 0;
                context.font = '22px ' + this.accentFont;
                context.fillStyle = 'rgba(210, 230, 255, 0.9)';
                const subText = won
                    ? `Great job commander! Escaped fish: ${this.game.escapedCount}`
                    : (this.game.gameOverReason || 'Submarine destroyed! Too many enemies breached your sector!');
                context.fillText(subText, this.game.width * 0.5, this.game.height * 0.5 + 5);

                // Stats breakdown
                context.font = 'bold 18px ' + this.accentFont;
                context.fillStyle = 'rgba(160, 210, 255, 0.8)';
                context.fillText(
                    `Final Score: ${Math.floor(this.game.score)}   |   Health Left: ${Math.ceil(this.game.health)}%   |   Wave Reached: ${this.game.wave}`,
                    this.game.width * 0.5,
                    this.game.height * 0.5 + 50
                );

                // Restart prompt
                const restartAlpha = 0.5 + Math.sin(this.gameOverPulse * 2) * 0.4;
                context.globalAlpha = this.gameOverAlpha * restartAlpha;
                context.font = '18px ' + this.accentFont;
                context.fillStyle = '#ffffff';
                context.fillText(
                    '[ Press ENTER to Try Again ]',
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
            this.background = new Background(this);
            this.ui = new UI(this);
            this.keys = [];
            this.enemies = [];
            this.particles = [];
            this.explosions = [];
            this.floatingTexts = [];
            this.enemyTimer = 0;
            this.enemyInterval = 1800;
            this.ammo = 20;
            this.maxAmmo = 50;
            this.ammoTimer = 0;
            this.ammoInterval = 320;
            this.player = new Player(this);
            this.input = new InputHandler(this);
            this.gameOver = false;
            this.gameOverReason = '';
            this.score = 0;
            this.winningScore = 100;
            this.health = 100;
            this.maxHealth = 100;
            this.escapedCount = 0;
            this.gameTime = 0;
            this.timeLimit = 35000; // 35s wave limit
            this.speed = 1;
            this.debug = false;
            this.maxParticles = 200;
            this.wave = 1;
            this.waveThreshold = 30;
            // Screen shake
            this.shakeIntensity = 0;
            this.shakeTimer = 0;
        }
        update(deltaTime) {
            if (!this.gameOver) this.gameTime += deltaTime;
            
            // Win condition: time expired with health remaining OR reached target score
            if (this.gameTime >= this.timeLimit && !this.gameOver) {
                if (this.health > 0) {
                    this.gameOver = true;
                } else {
                    this.gameOverReason = 'TIME EXPIRED WITH DEFENSE BREACHED!';
                    this.gameOver = true;
                }
            }

            this.background.update();
            this.player.update(deltaTime);

            // Wave progression
            const newWave = Math.floor(this.score / this.waveThreshold) + 1;
            if (newWave > this.wave) {
                this.wave = newWave;
                this.enemyInterval = Math.max(550, 1800 - (this.wave - 1) * 160);
                this.floatingTexts.push(
                    new FloatingText(`WAVE ${this.wave} STARTED!`, this.width * 0.45, 200, '#6ee7ff')
                );
            }

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
                    } else if (!this.gameOver) {
                        const directDamage = 20;
                        this.health = Math.max(0, this.health - directDamage);
                        this.score = Math.max(0, this.score - 1);
                        this.triggerShake(10, 300);
                        this.floatingTexts.push(
                            new FloatingText(`-${directDamage} HP`, this.player.x + 100, this.player.y, '#ff3344')
                        );
                        if (this.health <= 0) {
                            this.gameOverReason = 'SUBMARINE DESTROYED IN COMBAT!';
                            this.gameOver = true;
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
                                        `+${enemy.score}`,
                                        enemy.x + enemy.width * 0.4,
                                        enemy.y,
                                        '#00ffc8'
                                    )
                                );
                            }
                            if (this.score >= this.winningScore && !this.gameOver) {
                                this.gameOver = true;
                            }
                        }
                    }
                });
            });

            this.enemies = this.enemies.filter(enemy => !enemy.markedForDeletion);

            // Enemy Spawning
            if (this.enemyTimer > this.enemyInterval && !this.gameOver) {
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
            
            // Foreground decoration layer
            this.background.layer4.draw(context);
            this.ui.draw(context);

            context.restore();
        }
        addEnemy() {
            const randomize = Math.random();
            if (randomize < 0.45) this.enemies.push(new Angler1(this));
            else if (randomize < 0.70) this.enemies.push(new Angler2(this));
            else if (randomize < 0.82) this.enemies.push(new HiveWhale(this));
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
            this.enemyInterval = 1800;
            this.gameOver = false;
            this.gameOverReason = '';
            this.score = 0;
            this.health = 100;
            this.escapedCount = 0;
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
