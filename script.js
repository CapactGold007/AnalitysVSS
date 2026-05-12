// Seleção de elementos
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const menu = document.getElementById('menu');

let gameActive = false;

// Configuração dos Poderes (6 tipos de bolas)
const powerTypes = [
    { name: "Fogo", color: "#ff4d4d", speed: 10 },
    { name: "Gelo", color: "#7efff5", speed: 8 },
    { name: "Raio", color: "#fff200", speed: 15 },
    { name: "Veneno", color: "#32ff7e", speed: 6 },
    { name: "Sombra", color: "#7d5fff", speed: 9 },
    { name: "Luz", color: "#ffffff", speed: 12 }
];

// Estado do Jogador
const player = {
    x: 100, y: 300, w: 50, h: 60,
    color: "#3498db",
    dy: 0, gravity: 0.8, jumpPower: -18,
    grounded: false,
    projectiles: []
};

const enemy = {
    x: 800, y: 300, w: 50, h: 60,
    color: "#e74c3c",
    health: 100
};

// --- Lógica de Salas ---

function showCreateRoom() {
    document.getElementById('main-options').classList.add('hidden');
    document.getElementById('create-area').classList.remove('hidden');
    // Gera código aleatório de 4 dígitos
    const code = Math.floor(1000 + Math.random() * 9000);
    document.getElementById('room-code-display').innerText = code;
}

function showJoinRoom() {
    document.getElementById('main-options').classList.add('hidden');
    document.getElementById('join-area').classList.remove('hidden');
}

function backToMenu() {
    document.getElementById('main-options').classList.remove('hidden');
    document.getElementById('join-area').classList.add('hidden');
    document.getElementById('create-area').classList.add('hidden');
}

function joinRoom() {
    const input = document.getElementById('room-input').value;
    if(input.length === 4) {
        startGame();
    } else {
        alert("Digite os 4 dígitos para entrar!");
    }
}

// --- Lógica do Jogo ---

function startGame() {
    document.getElementById('ui-container').style.display = 'none';
    canvas.style.display = 'block';
    gameActive = true;
    requestAnimationFrame(gameLoop);
}

// Comandos do Teclado
window.addEventListener('keydown', (e) => {
    if (!gameActive) return;

    // Pulo
    if (e.code === 'Space' && player.grounded) {
        player.dy = player.jumpPower;
        player.grounded = false;
    }

    // Poderes (Teclas 1 a 6)
    if (e.key >= 1 && e.key <= 6) {
        launchPower(e.key - 1);
    }
});

function launchPower(index) {
    const power = powerTypes[index];
    player.projectiles.push({
        x: player.x + player.w,
        y: player.y + 20,
        radius: 12,
        color: power.color,
        vx: power.speed
    });
}

function update() {
    // Física do Jogador
    player.dy += player.gravity;
    player.y += player.dy;

    // Chão simples em y=400
    if (player.y + player.h > 400) {
        player.y = 400 - player.h;
        player.dy = 0;
        player.grounded = true;
    }

    // Mover Projéteis
    player.projectiles.forEach((p, i) => {
        p.x += p.vx;
        
        // Colisão com Inimigo
        if (p.x > enemy.x && p.x < enemy.x + enemy.w && p.y > enemy.y && p.y < enemy.y + enemy.h) {
            enemy.health -= 5;
            player.projectiles.splice(i, 1);
        }

        // Remover se sair da tela
        if (p.x > canvas.width) player.projectiles.splice(i, 1);
    });
}

function draw() {
    // Limpar Tela
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Chão
    ctx.fillStyle = "#2c3e50";
    ctx.fillRect(0, 400, canvas.width, 100);

    // Jogador
    ctx.fillStyle = player.color;
    ctx.fillRect(player.x, player.y, player.w, player.h);

    // Inimigo
    ctx.fillStyle = enemy.color;
    ctx.fillRect(enemy.x, enemy.y, enemy.w, enemy.h);

    // Poderes (Bolas de cores diferentes)
    player.projectiles.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();
        ctx.shadowBlur = 15;
        ctx.shadowColor = p.color;
        ctx.closePath();
    });
    ctx.shadowBlur = 0; // Reset sombra

    // HUD
    ctx.fillStyle = "white";
    ctx.font = "20px Arial";
    ctx.fillText("Vida Inimigo: " + enemy.health + "%", 800, 50);
    ctx.fillText("Teclas 1-6: Atirar Poderes | Espaço: Pular", 20, 50);
}

function gameLoop() {
    if (!gameActive) return;
    update();
    draw();
    requestAnimationFrame(gameLoop);
}