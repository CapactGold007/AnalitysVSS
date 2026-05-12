const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
let gameActive = false;

// Configurações do Jogador
const player = {
    x: 100, y: 300, w: 40, h: 40,
    color: "#3498db",
    speed: 5,
    dx: 0, dy: 0,
    gravity: 0.8, jumpPower: -15,
    grounded: false,
    projectiles: []
};

const enemy = { x: 700, y: 310, w: 40, h: 40, color: "#e74c3c", health: 100 };

// Cores dos 6 poderes
const powers = ["#ff4d4d", "#7efff5", "#fff200", "#32ff7e", "#7d5fff", "#ffffff"];

// Sistema de Teclas pressionadas
const keys = {};

window.addEventListener('keydown', e => keys[e.code] = true);
window.addEventListener('keyup', e => keys[e.code] = false);

// Funções de Menu
function showCreateRoom() {
    document.getElementById('main-options').classList.add('hidden');
    document.getElementById('create-area').classList.remove('hidden');
    document.getElementById('room-code-display').innerText = Math.floor(1000 + Math.random() * 9000);
}

function showJoinRoom() {
    document.getElementById('main-options').classList.add('hidden');
    document.getElementById('join-area').classList.remove('hidden');
}

function joinRoom() {
    if(document.getElementById('room-input').value.length === 4) startGame();
}

function startGame() {
    document.getElementById('ui-container').style.display = 'none';
    canvas.style.display = 'block';
    gameActive = true;
    gameLoop();
}

function launchPower(i) {
    player.projectiles.push({ x: player.x + 20, y: player.y + 20, vx: 10, color: powers[i] });
}

function update() {
    // Movimentação Esquerda/Direita
    if (keys['KeyA'] || keys['ArrowLeft']) player.x -= player.speed;
    if (keys['KeyD'] || keys['ArrowRight']) player.x += player.speed;
    
    // Pulo
    if ((keys['Space'] || keys['KeyW']) && player.grounded) {
        player.dy = player.jumpPower;
        player.grounded = false;
    }

    // Ataques (Teclas 1 a 6)
    for(let i=1; i<=6; i++) {
        if(keys['Digit'+i]) {
            launchPower(i-1);
            keys['Digit'+i] = false; // Evita tiro infinito
        }
    }

    // Física e Gravidade
    player.dy += player.gravity;
    player.y += player.dy;

    if (player.y > 310) {
        player.y = 310;
        player.dy = 0;
        player.grounded = true;
    }

    // Limites da tela
    if(player.x < 0) player.x = 0;
    if(player.x > canvas.width - player.w) player.x = canvas.width - player.w;

    // Balas
    player.projectiles.forEach((p, i) => {
        p.x += p.vx;
        if(p.x > enemy.x && p.x < enemy.x + enemy.w && p.y > enemy.y && p.y < enemy.y + enemy.h) {
            enemy.health -= 2;
            player.projectiles.splice(i, 1);
        }
    });
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Chão
    ctx.fillStyle = "#222";
    ctx.fillRect(0, 350, canvas.width, 50);

    // Jogador e Inimigo
    ctx.fillStyle = player.color;
    ctx.fillRect(player.x, player.y, player.w, player.h);
    ctx.fillStyle = enemy.color;
    ctx.fillRect(enemy.x, enemy.y, enemy.w, enemy.h);

    // Tiros
    player.projectiles.forEach(p => {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 8, 0, Math.PI*2);
        ctx.fill();
    });

    // Vida
    ctx.fillStyle = "white";
    ctx.fillText(`Vida Inimigo: ${enemy.health}`, 700, 30);
}

function gameLoop() {
    if(!gameActive) return;
    update();
    draw();
    requestAnimationFrame(gameLoop);
}