import * as THREE from 'three';

// ────────────────────────────────────────────
//  CONSTANTS
// ────────────────────────────────────────────
const GAME_WIDTH = 80;     // world units visible width
const GAME_HEIGHT = 40;    // world units visible height
const WINNING_SCORE = 100;
const TIME_LIMIT = 30;     // seconds
const MAX_AMMO = 50;
const AMMO_REGEN_INTERVAL = 0.35; // seconds
const MAX_PARTICLES = 200;
const WAVE_THRESHOLD = 30;

// ────────────────────────────────────────────
//  HUD DOM REFS
// ────────────────────────────────────────────
const hudScore = document.getElementById('hud-score');
const hudWave = document.getElementById('hud-wave');
const hudAmmo = document.getElementById('hud-ammo');
const hudTimer = document.getElementById('hud-timer');
const hudTimerText = document.getElementById('hud-timer-text');
const gameOverOverlay = document.getElementById('game-over-overlay');
const gameOverTitle = document.getElementById('game-over-title');
const gameOverSubtitle = document.getElementById('game-over-subtitle');
const gameOverScore = document.getElementById('game-over-score');

// ────────────────────────────────────────────
//  THREE.JS SETUP
// ────────────────────────────────────────────
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a84c1); // Vibrant tropical ocean blue
scene.fog = new THREE.FogExp2(0x0d72a5, 0.015); // Clear blue water fog

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 200);
camera.position.set(0, 5, 45);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.4;
document.getElementById('game-container').appendChild(renderer.domElement);

// ── Lighting ──
// Bright ambient sky/water fill
const ambientLight = new THREE.AmbientLight(0x76d7ff, 1.4);
scene.add(ambientLight);

// Sun light penetrating water surface
const dirLight = new THREE.DirectionalLight(0xffffff, 2.2);
dirLight.position.set(10, 40, 20);
dirLight.castShadow = true;
dirLight.shadow.mapSize.set(1024, 1024);
dirLight.shadow.camera.near = 1;
dirLight.shadow.camera.far = 100;
dirLight.shadow.camera.left = -50;
dirLight.shadow.camera.right = 50;
dirLight.shadow.camera.top = 30;
dirLight.shadow.camera.bottom = -30;
scene.add(dirLight);

// Hemisphere light (sky blue top, teal bottom)
const hemiLight = new THREE.HemisphereLight(0x80e5ff, 0x005c8a, 1.2);
scene.add(hemiLight);

// Caustic-like moving light
const causticLight = new THREE.PointLight(0x80ffff, 1.5, 120);
causticLight.position.set(0, 25, 10);
scene.add(causticLight);

// ── Seabed (Bright Sandy Floor) ──
const seabedGeo = new THREE.PlaneGeometry(200, 200, 40, 40);
const positions = seabedGeo.attributes.position;
for (let i = 0; i < positions.count; i++) {
    positions.setZ(i, (Math.random() - 0.5) * 2.5);
}
seabedGeo.computeVertexNormals();
const seabedMat = new THREE.MeshStandardMaterial({
    color: 0xdfb15b, // Golden ocean sand
    roughness: 0.8,
    metalness: 0.1,
    flatShading: true
});
const seabed = new THREE.Mesh(seabedGeo, seabedMat);
seabed.rotation.x = -Math.PI * 0.5;
seabed.position.y = -18;
seabed.receiveShadow = true;
scene.add(seabed);

// ── Underwater Bubbles (environment) ──
const bubbleCount = 80;
const bubbleGeo = new THREE.SphereGeometry(0.15, 8, 8);
const bubbleMat = new THREE.MeshPhysicalMaterial({
    color: 0x88ddff,
    transparent: true,
    opacity: 0.25,
    roughness: 0.1,
    metalness: 0,
    transmission: 0.8,
});
const bubbles = [];
for (let i = 0; i < bubbleCount; i++) {
    const b = new THREE.Mesh(bubbleGeo, bubbleMat.clone());
    b.position.set(
        (Math.random() - 0.5) * 100,
        (Math.random() - 0.5) * 40,
        (Math.random() - 0.5) * 30 - 5
    );
    const s = 0.3 + Math.random() * 1;
    b.scale.set(s, s, s);
    b.userData.speedY = 0.5 + Math.random() * 1.5;
    b.userData.wobble = Math.random() * Math.PI * 2;
    scene.add(b);
    bubbles.push(b);
}

// ── Kelp / Coral decoration (Vibrant Reef) ──
const coralColors = [0xff2a75, 0x00e5ff, 0x2ecc71, 0xff9f43, 0x9b59b6, 0x1dd1a1];
for (let i = 0; i < 30; i++) {
    const height = 2 + Math.random() * 7;
    const geo = new THREE.CylinderGeometry(0.15, 0.45, height, 6);
    const color = coralColors[Math.floor(Math.random() * coralColors.length)];
    const coralMat = new THREE.MeshStandardMaterial({ color, roughness: 0.5, flatShading: true });
    const mesh = new THREE.Mesh(geo, coralMat);
    mesh.position.set(
        (Math.random() - 0.5) * 130,
        -18 + height * 0.5,
        (Math.random() - 0.5) * 25 - 5
    );
    mesh.rotation.z = (Math.random() - 0.5) * 0.35;
    mesh.castShadow = true;
    scene.add(mesh);
    // sphere on top
    if (Math.random() > 0.3) {
        const sg = new THREE.SphereGeometry(0.5 + Math.random() * 0.6, 6, 6);
        const smMat = new THREE.MeshStandardMaterial({
            color: coralColors[Math.floor(Math.random() * coralColors.length)],
            roughness: 0.4,
            flatShading: true
        });
        const sm = new THREE.Mesh(sg, smMat);
        sm.position.copy(mesh.position);
        sm.position.y += height * 0.5;
        scene.add(sm);
    }
}

// ────────────────────────────────────────────
//  PROCEDURAL MODEL BUILDERS
// ────────────────────────────────────────────

function createSubmarine() {
    const group = new THREE.Group();

    // body - Vibrant Yellow Submarine style with orange accents
    const bodyGeo = new THREE.CapsuleGeometry(1.2, 4, 8, 16);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0xffb703, metalness: 0.3, roughness: 0.2 });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.rotation.z = Math.PI * 0.5;
    body.castShadow = true;
    group.add(body);

    // orange stripe / conning tower
    const towerGeo = new THREE.BoxGeometry(1.2, 1, 0.8);
    const towerMat = new THREE.MeshStandardMaterial({ color: 0xfb8500, metalness: 0.3, roughness: 0.3 });
    const tower = new THREE.Mesh(towerGeo, towerMat);
    tower.position.set(-0.3, 1.2, 0);
    tower.castShadow = true;
    group.add(tower);

    // periscope
    const periGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.8, 8);
    const periMat = new THREE.MeshStandardMaterial({ color: 0x023e8a, metalness: 0.8 });
    const peri = new THREE.Mesh(periGeo, periMat);
    peri.position.set(-0.3, 1.9, 0);
    group.add(peri);

    // windows (glowing cyan portholes)
    const portGeo = new THREE.SphereGeometry(0.3, 8, 8);
    const portMat = new THREE.MeshBasicMaterial({ color: 0x00f5d4 });
    for (let i = 0; i < 3; i++) {
        const port1 = new THREE.Mesh(portGeo, portMat);
        port1.position.set(-1.2 + i * 1.0, 0.2, 1.1);
        group.add(port1);

        const port2 = new THREE.Mesh(portGeo, portMat);
        port2.position.set(-1.2 + i * 1.0, 0.2, -1.1);
        group.add(port2);
    }

    // propeller hub
    const propGeo = new THREE.CylinderGeometry(0.15, 0.15, 0.3, 8);
    const propMat = new THREE.MeshStandardMaterial({ color: 0x023e8a, metalness: 0.8 });
    const prop = new THREE.Mesh(propGeo, propMat);
    prop.position.set(-3.2, 0, 0);
    prop.rotation.z = Math.PI * 0.5;
    group.add(prop);

    // propeller blades
    const bladeGroup = new THREE.Group();
    const bladeGeo = new THREE.BoxGeometry(0.1, 1.5, 0.3);
    for (let i = 0; i < 4; i++) {
        const blade = new THREE.Mesh(bladeGeo, propMat);
        blade.rotation.x = (Math.PI / 2) * i;
        bladeGroup.add(blade);
    }
    bladeGroup.position.set(-3.4, 0, 0);
    group.add(bladeGroup);
    group.userData.propeller = bladeGroup;

    // engine glow
    const glowMat = new THREE.MeshBasicMaterial({ color: 0x00f5d4 });
    const glowGeo = new THREE.SphereGeometry(0.4, 8, 8);
    const glow = new THREE.Mesh(glowGeo, glowMat);
    glow.position.set(3.2, 0, 0);
    group.add(glow);

    // point light on front
    const headlight = new THREE.PointLight(0x00f5d4, 1.8, 25);
    headlight.position.set(3.5, 0, 0);
    group.add(headlight);

    return group;
}

function createAnglerFish(color, size, lureColor) {
    const group = new THREE.Group();

    // body
    const bodyGeo = new THREE.SphereGeometry(size, 10, 8);
    bodyGeo.scale(1.5, 1, 1);
    const bodyMat = new THREE.MeshStandardMaterial({ color, roughness: 0.4, metalness: 0.1, flatShading: true });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.castShadow = true;
    group.add(body);

    // mouth
    const mouthGeo = new THREE.ConeGeometry(size * 0.6, size * 1.2, 8);
    const mouthMat = new THREE.MeshStandardMaterial({ color: 0xff4757, roughness: 0.5, flatShading: true });
    const mouth = new THREE.Mesh(mouthGeo, mouthMat);
    mouth.rotation.z = Math.PI * 0.5;
    mouth.position.set(size * 1.6, 0, 0);
    group.add(mouth);

    // tail fin
    const tailGeo = new THREE.ConeGeometry(size * 0.7, size * 0.8, 4);
    const tail = new THREE.Mesh(tailGeo, bodyMat);
    tail.rotation.z = -Math.PI * 0.5;
    tail.position.set(-size * 1.6, 0, 0);
    group.add(tail);

    // dorsal fin
    const finGeo = new THREE.ConeGeometry(size * 0.3, size * 0.8, 4);
    const fin = new THREE.Mesh(finGeo, bodyMat);
    fin.position.set(-size * 0.3, size * 0.9, 0);
    group.add(fin);

    // eye
    const eyeGeo = new THREE.SphereGeometry(size * 0.22, 8, 8);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xfffa65 });
    const eye = new THREE.Mesh(eyeGeo, eyeMat);
    eye.position.set(size * 0.7, size * 0.4, size * 0.6);
    group.add(eye);
    const eye2 = eye.clone();
    eye2.position.z = -size * 0.6;
    group.add(eye2);

    // lure (angler light)
    const lureGeo = new THREE.SphereGeometry(size * 0.25, 8, 8);
    const lureMat = new THREE.MeshBasicMaterial({ color: lureColor });
    const lure = new THREE.Mesh(lureGeo, lureMat);
    lure.position.set(size * 0.5, size * 1.3, 0);
    group.add(lure);

    const lureLight = new THREE.PointLight(lureColor, 1.2, 12);
    lureLight.position.copy(lure.position);
    group.add(lureLight);

    // stalk
    const stalkGeo = new THREE.CylinderGeometry(0.06, 0.06, size * 0.8, 4);
    const stalkMat = new THREE.MeshStandardMaterial({ color });
    const stalk = new THREE.Mesh(stalkGeo, stalkMat);
    stalk.position.set(size * 0.5, size * 0.9, 0);
    group.add(stalk);

    return group;
}

function createLuckyFish() {
    const group = new THREE.Group();
    const bodyGeo = new THREE.SphereGeometry(1, 10, 8);
    bodyGeo.scale(1.3, 1, 0.7);
    const bodyMat = new THREE.MeshStandardMaterial({
        color: 0xffd700,
        metalness: 0.6,
        roughness: 0.1,
        emissive: 0xff9f43,
        emissiveIntensity: 0.5
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.castShadow = true;
    group.add(body);

    // tail
    const tailGeo = new THREE.ConeGeometry(0.6, 0.8, 4);
    const tail = new THREE.Mesh(tailGeo, bodyMat);
    tail.rotation.z = -Math.PI * 0.5;
    tail.position.set(-1.5, 0, 0);
    group.add(tail);

    // fins
    const finGeo = new THREE.ConeGeometry(0.3, 0.7, 4);
    const fin1 = new THREE.Mesh(finGeo, bodyMat);
    fin1.position.set(0, 0.9, 0);
    group.add(fin1);

    // glow
    const glowLight = new THREE.PointLight(0xfffa65, 1.5, 15);
    group.add(glowLight);

    return group;
}

function createHiveWhale() {
    const group = new THREE.Group();

    // massive body - Vibrant Royal Purple/Blue
    const bodyGeo = new THREE.SphereGeometry(3, 12, 10);
    bodyGeo.scale(2.2, 1, 1);
    const bodyMat = new THREE.MeshStandardMaterial({
        color: 0x341f97,
        roughness: 0.4,
        metalness: 0.2,
        flatShading: true
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.castShadow = true;
    group.add(body);

    // glowing neon ridges
    const ridgeMat = new THREE.MeshStandardMaterial({ color: 0x00d2d3, emissive: 0x00d2d3, emissiveIntensity: 0.6 });
    for (let i = 0; i < 5; i++) {
        const ridgeGeo = new THREE.BoxGeometry(0.6, 0.8, 1.5);
        const ridge = new THREE.Mesh(ridgeGeo, ridgeMat);
        ridge.position.set(-2 + i * 1.2, 2.8, 0);
        group.add(ridge);
    }

    // tail
    const tailGeo = new THREE.ConeGeometry(2, 3, 6);
    const tail = new THREE.Mesh(tailGeo, bodyMat);
    tail.rotation.z = -Math.PI * 0.5;
    tail.position.set(-6, 0, 0);
    group.add(tail);

    // eye
    const eyeGeo = new THREE.SphereGeometry(0.4, 8, 8);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff4757 });
    const eye = new THREE.Mesh(eyeGeo, eyeMat);
    eye.position.set(4.5, 1, 2.5);
    group.add(eye);
    const eye2 = eye.clone();
    eye2.position.z = -2.5;
    group.add(eye2);

    return group;
}

function createDrone() {
    const group = new THREE.Group();

    const bodyGeo = new THREE.OctahedronGeometry(0.8, 0);
    const bodyMat = new THREE.MeshStandardMaterial({
        color: 0xff4757,
        metalness: 0.5,
        roughness: 0.2,
        emissive: 0xff6b81,
        emissiveIntensity: 0.4
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.castShadow = true;
    group.add(body);

    // ring
    const ringGeo = new THREE.TorusGeometry(1.1, 0.08, 8, 24);
    const ringMat = new THREE.MeshStandardMaterial({ color: 0x00d2d3, metalness: 0.7, roughness: 0.1 });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    group.add(ring);
    group.userData.ring = ring;

    // glow
    const light = new THREE.PointLight(0xff4757, 0.8, 8);
    group.add(light);

    return group;
}

function createTorpedo() {
    const group = new THREE.Group();

    const bodyGeo = new THREE.CylinderGeometry(0.12, 0.12, 1.2, 8);
    const bodyMat = new THREE.MeshStandardMaterial({
        color: 0x00ddff,
        emissive: 0x0088ff,
        emissiveIntensity: 0.6,
        metalness: 0.5
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.rotation.z = Math.PI * 0.5;
    group.add(body);

    // nose cone
    const noseGeo = new THREE.ConeGeometry(0.12, 0.4, 8);
    const nose = new THREE.Mesh(noseGeo, bodyMat);
    nose.rotation.z = -Math.PI * 0.5;
    nose.position.set(0.8, 0, 0);
    group.add(nose);

    // glow
    const light = new THREE.PointLight(0x00ccff, 0.4, 6);
    group.add(light);

    return group;
}

// ────────────────────────────────────────────
//  GAME STATE
// ────────────────────────────────────────────
const state = {
    keys: new Set(),
    score: 0,
    wave: 1,
    ammo: 20,
    ammoTimer: 0,
    gameTime: 0,
    gameOver: false,
    debug: false,
    speed: 1,
    shakeTimer: 0,
    shakeIntensity: 0,
    // original camera pos for shake reset
    camBasePos: new THREE.Vector3(0, 5, 45),
};

// ── Entity Arrays ──
let playerObj, playerData;
const enemies = [];
const projectiles = [];
const particles = [];
const explosions = [];
const floatingTexts = []; // we handle these as 3D sprites

// ────────────────────────────────────────────
//  PLAYER
// ────────────────────────────────────────────
playerObj = createSubmarine();
playerObj.position.set(-30, 0, 0);
scene.add(playerObj);
playerData = {
    speedY: 0,
    maxSpeed: 0.4,
    powerUp: false,
    powerUpTimer: 0,
    powerUpLimit: 10,
    y: 0,
};

// ────────────────────────────────────────────
//  INPUT
// ────────────────────────────────────────────
window.addEventListener('keydown', e => {
    state.keys.add(e.key);
    if (e.key === ' ') shoot();
    if (e.key === 'd') state.debug = !state.debug;
    if (e.key === 'Enter' && state.gameOver) restart();
});
window.addEventListener('keyup', e => state.keys.delete(e.key));

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// ────────────────────────────────────────────
//  SHOOTING
// ────────────────────────────────────────────
function shoot() {
    if (state.gameOver || state.ammo <= 0) return;
    spawnTorpedo(playerObj.position.x + 4, playerObj.position.y + 0.3, 0);
    state.ammo--;
    if (playerData.powerUp && state.ammo > 0) {
        spawnTorpedo(playerObj.position.x + 4, playerObj.position.y - 0.5, 0);
        state.ammo--;
    }
}

function spawnTorpedo(x, y, z) {
    const t = createTorpedo();
    t.position.set(x, y, z);
    scene.add(t);
    projectiles.push({
        mesh: t,
        speed: 0.6,
        markedForDeletion: false,
        width: 1.2,
        height: 0.24,
        get x() { return t.position.x - 0.6; },
        get y() { return t.position.y - 0.12; },
    });
}

// ────────────────────────────────────────────
//  ENEMY SPAWNING
// ────────────────────────────────────────────
let enemyTimer = 0;
let enemyInterval = 2;

function addEnemy() {
    const r = Math.random();
    let mesh, data;
    const spawnX = 50;

    if (r < 0.5) {
        // Angler1 - Vibrant Emerald Teal
        mesh = createAnglerFish(0x00b894, 1.5, 0x00efff);
        const y = (Math.random() - 0.5) * 28;
        mesh.position.set(spawnX, y, (Math.random() - 0.5) * 6);
        data = { lives: 5, score: 5, speedX: 0.08 + Math.random() * 0.12, width: 5, height: 3 };
    } else if (r < 0.6) {
        // Angler2 - Vibrant Neon Magenta/Purple
        mesh = createAnglerFish(0x9b59b6, 1.8, 0xff007f);
        const y = (Math.random() - 0.5) * 28;
        mesh.position.set(spawnX, y, (Math.random() - 0.5) * 6);
        data = { lives: 6, score: 6, speedX: 0.07 + Math.random() * 0.1, width: 6, height: 3.5 };
    } else if (r < 0.7) {
        // Hive Whale
        mesh = createHiveWhale();
        const y = (Math.random() - 0.5) * 20;
        mesh.position.set(spawnX + 5, y, (Math.random() - 0.5) * 4);
        data = { lives: 20, score: 20, speedX: 0.04 + Math.random() * 0.04, width: 14, height: 6, type: 'hive' };
    } else {
        // Lucky Fish
        mesh = createLuckyFish();
        const y = (Math.random() - 0.5) * 28;
        mesh.position.set(spawnX, y, (Math.random() - 0.5) * 6);
        data = { lives: 5, score: 15, speedX: 0.06 + Math.random() * 0.1, width: 3, height: 2, type: 'lucky' };
    }

    mesh.castShadow = true;
    scene.add(mesh);
    enemies.push({
        mesh,
        ...data,
        markedForDeletion: false,
        get x() { return mesh.position.x - this.width * 0.5; },
        get y() { return mesh.position.y - this.height * 0.5; },
    });
}

function spawnDrone(x, y) {
    const mesh = createDrone();
    mesh.position.set(x, y, (Math.random() - 0.5) * 4);
    scene.add(mesh);
    enemies.push({
        mesh,
        lives: 3,
        score: 3,
        speedX: 0.15 + Math.random() * 0.2,
        width: 2.2,
        height: 2.2,
        type: 'drone',
        markedForDeletion: false,
        get x() { return mesh.position.x - this.width * 0.5; },
        get y() { return mesh.position.y - this.height * 0.5; },
    });
}

// ────────────────────────────────────────────
//  PARTICLES & EXPLOSIONS
// ────────────────────────────────────────────
const debrisGeo = new THREE.OctahedronGeometry(0.2, 0);
const debrisMats = [
    new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.6, flatShading: true }),
    new THREE.MeshStandardMaterial({ color: 0x666666, metalness: 0.7, flatShading: true }),
    new THREE.MeshStandardMaterial({ color: 0xaaaaaa, metalness: 0.5, flatShading: true }),
];

function spawnDebris(x, y, z, count) {
    for (let i = 0; i < count && particles.length < MAX_PARTICLES; i++) {
        const m = new THREE.Mesh(debrisGeo, debrisMats[Math.floor(Math.random() * 3)]);
        m.position.set(x, y, z);
        const s = 0.3 + Math.random() * 0.7;
        m.scale.set(s, s, s);
        scene.add(m);
        particles.push({
            mesh: m,
            vx: (Math.random() - 0.5) * 0.4,
            vy: (Math.random() - 0.2) * 0.5,
            vz: (Math.random() - 0.5) * 0.3,
            gravity: -0.008,
            rotSpeed: new THREE.Vector3(
                (Math.random() - 0.5) * 0.2,
                (Math.random() - 0.5) * 0.2,
                (Math.random() - 0.5) * 0.2
            ),
            life: 2 + Math.random() * 2,
            age: 0,
            markedForDeletion: false,
        });
    }
}

function spawnExplosion(x, y, z) {
    const count = 12;
    for (let i = 0; i < count; i++) {
        const geo = new THREE.SphereGeometry(0.15 + Math.random() * 0.3, 6, 6);
        const color = Math.random() > 0.5 ? 0xff6622 : 0xffaa00;
        const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 1 });
        const m = new THREE.Mesh(geo, mat);
        m.position.set(x, y, z);
        scene.add(m);
        explosions.push({
            mesh: m,
            vx: (Math.random() - 0.5) * 0.5,
            vy: (Math.random() - 0.5) * 0.5,
            vz: (Math.random() - 0.5) * 0.4,
            life: 0.6 + Math.random() * 0.6,
            age: 0,
            markedForDeletion: false,
        });
    }
    // flash light
    const flash = new THREE.PointLight(0xff8833, 3, 20);
    flash.position.set(x, y, z);
    scene.add(flash);
    setTimeout(() => scene.remove(flash), 200);
}

// ── Floating 3D Score Text ──
function spawnFloatingText(value, x, y, z) {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 64;
    const ctx2d = canvas.getContext('2d');
    ctx2d.font = 'bold 40px Orbitron, sans-serif';
    ctx2d.textAlign = 'center';
    ctx2d.textBaseline = 'middle';
    ctx2d.fillStyle = value > 0 ? '#00ffc8' : '#ff6666';
    ctx2d.shadowColor = value > 0 ? '#00ff88' : '#ff4444';
    ctx2d.shadowBlur = 12;
    ctx2d.fillText((value > 0 ? '+' : '') + value, 64, 32);

    const texture = new THREE.CanvasTexture(canvas);
    const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.position.set(x, y + 1, z);
    sprite.scale.set(4, 2, 1);
    scene.add(sprite);

    floatingTexts.push({
        sprite,
        vy: 0.03,
        life: 1.5,
        age: 0,
        markedForDeletion: false,
    });
}

// ────────────────────────────────────────────
//  COLLISION
// ────────────────────────────────────────────
function checkCollision(a, b) {
    return (
        a.x < b.x + b.width &&
        a.x + a.width > b.x &&
        a.y < b.y + b.height &&
        a.y + a.height > b.y
    );
}

// player bounding box
const playerBB = {
    width: 6,
    height: 2.4,
    get x() { return playerObj.position.x - 3; },
    get y() { return playerObj.position.y - 1.2; },
};

// ────────────────────────────────────────────
//  SCREEN SHAKE
// ────────────────────────────────────────────
function triggerShake(intensity, duration) {
    state.shakeIntensity = intensity;
    state.shakeTimer = duration;
}

// ────────────────────────────────────────────
//  UPDATE HUD
// ────────────────────────────────────────────
function updateHUD() {
    hudScore.textContent = Math.floor(state.score);
    hudWave.textContent = state.wave;

    const ammoRatio = Math.min(state.ammo / MAX_AMMO, 1);
    hudAmmo.style.width = (ammoRatio * 100) + '%';
    hudAmmo.classList.toggle('powered-up', playerData.powerUp);

    const timeRatio = Math.max(0, 1 - state.gameTime / TIME_LIMIT);
    hudTimer.style.width = (timeRatio * 100) + '%';
    hudTimer.classList.toggle('danger', timeRatio <= 0.3);
    hudTimerText.classList.toggle('danger', timeRatio <= 0.3);
    const timeLeft = Math.max(0, TIME_LIMIT - state.gameTime).toFixed(1);
    hudTimerText.textContent = timeLeft + 's';
}

// ────────────────────────────────────────────
//  GAME OVER
// ────────────────────────────────────────────
function showGameOver() {
    const won = state.score >= WINNING_SCORE;
    gameOverTitle.textContent = won ? 'Most Wondrous!' : 'Blazes!';
    gameOverTitle.classList.toggle('won', won);
    gameOverSubtitle.textContent = won ? 'Well done explorer!' : 'Better luck next time!';
    gameOverScore.textContent = 'Final Score: ' + Math.floor(state.score);
    gameOverOverlay.classList.remove('hidden');
    // trigger transition on next frame
    requestAnimationFrame(() => gameOverOverlay.classList.add('visible'));
}

// ────────────────────────────────────────────
//  RESTART
// ────────────────────────────────────────────
function restart() {
    // clear entities
    enemies.forEach(e => scene.remove(e.mesh));
    enemies.length = 0;
    projectiles.forEach(p => scene.remove(p.mesh));
    projectiles.length = 0;
    particles.forEach(p => scene.remove(p.mesh));
    particles.length = 0;
    explosions.forEach(e => scene.remove(e.mesh));
    explosions.length = 0;
    floatingTexts.forEach(f => scene.remove(f.sprite));
    floatingTexts.length = 0;

    // reset state
    state.score = 0;
    state.wave = 1;
    state.ammo = 20;
    state.ammoTimer = 0;
    state.gameTime = 0;
    state.gameOver = false;
    state.shakeTimer = 0;
    state.shakeIntensity = 0;
    enemyTimer = 0;
    enemyInterval = 2;

    playerData.powerUp = false;
    playerData.powerUpTimer = 0;
    playerObj.position.set(-30, 0, 0);

    gameOverOverlay.classList.remove('visible');
    setTimeout(() => gameOverOverlay.classList.add('hidden'), 600);
}

// ────────────────────────────────────────────
//  MAIN LOOP
// ────────────────────────────────────────────
const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);
    const dt = Math.min(clock.getDelta(), 0.05); // cap delta

    // ── Update game time ──
    if (!state.gameOver) {
        state.gameTime += dt;
        if (state.gameTime >= TIME_LIMIT) {
            state.gameOver = true;
            showGameOver();
        }
    }

    // ── Player movement ──
    if (!state.gameOver) {
        if (state.keys.has('ArrowUp')) playerData.speedY = playerData.maxSpeed;
        else if (state.keys.has('ArrowDown')) playerData.speedY = -playerData.maxSpeed;
        else playerData.speedY *= 0.9; // decelerate smoothly

        playerObj.position.y += playerData.speedY;
        // clamp
        playerObj.position.y = THREE.MathUtils.clamp(playerObj.position.y, -14, 14);
        // tilt on movement
        playerObj.rotation.z = THREE.MathUtils.lerp(playerObj.rotation.z, playerData.speedY * 0.5, 0.1);
    }

    // ── Propeller spin ──
    if (playerObj.userData.propeller) {
        playerObj.userData.propeller.rotation.x += 0.3;
    }

    // ── Ammo regen ──
    if (!state.gameOver) {
        state.ammoTimer += dt;
        if (state.ammoTimer >= AMMO_REGEN_INTERVAL) {
            if (state.ammo < MAX_AMMO) state.ammo++;
            state.ammoTimer = 0;
        }
    }

    // ── Power-up ──
    if (playerData.powerUp) {
        playerData.powerUpTimer += dt;
        if (playerData.powerUpTimer >= playerData.powerUpLimit) {
            playerData.powerUp = false;
            playerData.powerUpTimer = 0;
        } else {
            state.ammo = Math.min(state.ammo + dt * 3, MAX_AMMO);
        }
    }

    // ── Wave progression ──
    const newWave = Math.floor(state.score / WAVE_THRESHOLD) + 1;
    if (newWave > state.wave) {
        state.wave = newWave;
        enemyInterval = Math.max(0.5, 2 - (state.wave - 1) * 0.15);
    }

    // ── Enemy spawn ──
    if (!state.gameOver) {
        enemyTimer += dt;
        if (enemyTimer >= enemyInterval) {
            addEnemy();
            enemyTimer = 0;
        }
    }

    // ── Update projectiles ──
    for (let i = projectiles.length - 1; i >= 0; i--) {
        const p = projectiles[i];
        p.mesh.position.x += p.speed;
        if (p.mesh.position.x > 55) p.markedForDeletion = true;
        if (p.markedForDeletion) {
            scene.remove(p.mesh);
            projectiles.splice(i, 1);
        }
    }

    // ── Update enemies ──
    for (let i = enemies.length - 1; i >= 0; i--) {
        const e = enemies[i];
        e.mesh.position.x -= e.speedX + state.speed * dt;
        // wobble
        e.mesh.rotation.y = Math.sin(state.gameTime * 2 + i) * 0.15;
        e.mesh.position.y += Math.sin(state.gameTime * 1.5 + i * 2) * 0.01;

        // drone ring spin
        if (e.type === 'drone' && e.mesh.userData.ring) {
            e.mesh.userData.ring.rotation.z += 0.1;
            e.mesh.userData.ring.rotation.x += 0.05;
        }

        // off-screen
        if (e.mesh.position.x < -55) e.markedForDeletion = true;

        // collision with player
        if (!e.markedForDeletion && checkCollision(playerBB, e)) {
            e.markedForDeletion = true;
            spawnExplosion(e.mesh.position.x, e.mesh.position.y, e.mesh.position.z);
            spawnDebris(e.mesh.position.x, e.mesh.position.y, e.mesh.position.z, 8);
            if (e.type === 'lucky') {
                playerData.powerUp = true;
                playerData.powerUpTimer = 0;
                state.ammo = MAX_AMMO;
            } else if (!state.gameOver) {
                state.score--;
                triggerShake(0.8, 0.3);
                spawnFloatingText(-1, playerObj.position.x + 3, playerObj.position.y + 2, 0);
            }
        }

        // collision with projectiles
        for (let j = projectiles.length - 1; j >= 0; j--) {
            const p = projectiles[j];
            if (!e.markedForDeletion && !p.markedForDeletion && checkCollision(p, e)) {
                e.lives--;
                p.markedForDeletion = true;
                scene.remove(p.mesh);
                projectiles.splice(j, 1);
                spawnDebris(e.mesh.position.x, e.mesh.position.y, e.mesh.position.z, 1);

                if (e.lives <= 0) {
                    e.markedForDeletion = true;
                    spawnExplosion(e.mesh.position.x, e.mesh.position.y, e.mesh.position.z);
                    spawnDebris(e.mesh.position.x, e.mesh.position.y, e.mesh.position.z, e.score);

                    if (e.type === 'hive') {
                        for (let k = 0; k < 5; k++) {
                            spawnDrone(
                                e.mesh.position.x + (Math.random() - 0.5) * 8,
                                e.mesh.position.y + (Math.random() - 0.5) * 4
                            );
                        }
                    }

                    if (!state.gameOver) {
                        state.score += e.score;
                        spawnFloatingText(e.score, e.mesh.position.x, e.mesh.position.y + 2, e.mesh.position.z);

                        if (state.score >= WINNING_SCORE) {
                            state.gameOver = true;
                            showGameOver();
                        }
                    }
                }
            }
        }

        if (e.markedForDeletion) {
            scene.remove(e.mesh);
            enemies.splice(i, 1);
        }
    }

    // ── Update particles ──
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.age += dt;
        if (p.age > p.life) p.markedForDeletion = true;
        p.mesh.position.x += p.vx;
        p.vy += p.gravity;
        p.mesh.position.y += p.vy;
        p.mesh.position.z += p.vz;
        p.mesh.rotation.x += p.rotSpeed.x;
        p.mesh.rotation.y += p.rotSpeed.y;
        p.mesh.rotation.z += p.rotSpeed.z;
        if (p.markedForDeletion) {
            scene.remove(p.mesh);
            particles.splice(i, 1);
        }
    }

    // ── Update explosions ──
    for (let i = explosions.length - 1; i >= 0; i--) {
        const e = explosions[i];
        e.age += dt;
        if (e.age > e.life) e.markedForDeletion = true;
        e.mesh.position.x += e.vx;
        e.mesh.position.y += e.vy;
        e.mesh.position.z += e.vz;
        const s = 1 + e.age * 3;
        e.mesh.scale.set(s, s, s);
        e.mesh.material.opacity = Math.max(0, 1 - e.age / e.life);
        if (e.markedForDeletion) {
            scene.remove(e.mesh);
            explosions.splice(i, 1);
        }
    }

    // ── Update floating texts ──
    for (let i = floatingTexts.length - 1; i >= 0; i--) {
        const f = floatingTexts[i];
        f.age += dt;
        f.sprite.position.y += f.vy;
        f.sprite.material.opacity = Math.max(0, 1 - f.age / f.life);
        if (f.age > f.life) {
            scene.remove(f.sprite);
            f.sprite.material.map.dispose();
            f.sprite.material.dispose();
            floatingTexts.splice(i, 1);
        }
    }

    // ── Bubbles ──
    bubbles.forEach(b => {
        b.position.y += b.userData.speedY * dt;
        b.userData.wobble += dt * 2;
        b.position.x += Math.sin(b.userData.wobble) * 0.01;
        if (b.position.y > 22) {
            b.position.y = -20;
            b.position.x = (Math.random() - 0.5) * 100;
        }
    });

    // ── Caustic light motion ──
    causticLight.position.x = Math.sin(state.gameTime * 0.5) * 30;
    causticLight.position.z = Math.cos(state.gameTime * 0.3) * 15;
    causticLight.intensity = 0.4 + Math.sin(state.gameTime * 2) * 0.2;

    // ── Camera shake ──
    if (state.shakeTimer > 0) {
        state.shakeTimer -= dt;
        const i = state.shakeIntensity * (state.shakeTimer / 0.3);
        camera.position.set(
            state.camBasePos.x + (Math.random() - 0.5) * i * 2,
            state.camBasePos.y + (Math.random() - 0.5) * i * 2,
            state.camBasePos.z
        );
    } else {
        camera.position.lerp(state.camBasePos, 0.1);
    }

    // ── Debug wireframe toggle ──
    if (state.debug) {
        scene.traverse(child => {
            if (child.isMesh && child.material) {
                child.material.wireframe = true;
            }
        });
    } else {
        scene.traverse(child => {
            if (child.isMesh && child.material) {
                child.material.wireframe = false;
            }
        });
    }

    // ── HUD ──
    updateHUD();

    // ── Render ──
    renderer.render(scene, camera);
}

animate();
