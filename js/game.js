const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let level = 1;
const totalLevels = 8;
let gameStartTime;
let levelStartTime;
let message = `Nivel ${level}`;
let messageTimeout;
let gameRunning = false;

const player = {
    x: 100,
    y: 550,
    radius: 15,
    dx: 0,
    dy: 0,
    speed: 5,
    // AJUSTE: Se redujo la fuerza del salto para que sea más corto y lento.
    jumpStrength: 12,
    onGround: false
};

const enemy = {
    x: canvas.width - 100,
    y: 50,
    width: 40,
    height: 40
};

const platforms = [
    { x: 0, y: 580, width: 600, height: 20, incline: 0 },
    { x: 200, y: 480, width: 600, height: 20, incline: 0 },
    { x: 0, y: 380, width: 600, height: 20, incline: 0 },
    { x: 200, y: 280, width: 600, height: 20, incline: 0 },
    { x: 0, y: 180, width: 600, height: 20, incline: 0 },
    { x: 200, y: 80, width: 600, height: 20, incline: 0 }
];

function setupEnemyPosition() {
    const topPlatform = platforms[platforms.length - 1];
    enemy.y = topPlatform.y - enemy.height;
}

let barrels = [];
let barrelSpeed = 1.5;
let barrelSpawnRate = 2000;

function drawPlayer() {
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
    ctx.fillStyle = 'blue';
    ctx.fill();
    ctx.closePath();
}

function drawEnemy() {
    ctx.fillStyle = 'red';
    ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
}

function drawPlatforms() {
    ctx.fillStyle = 'green';
    platforms.forEach(platform => {
        ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
    });
}

function drawBarrels() {
    ctx.fillStyle = 'brown';
    barrels.forEach(barrel => {
        ctx.beginPath();
        ctx.arc(barrel.x, barrel.y, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.closePath();
    });
}

function drawMessage() {
    if (message) {
        ctx.font = '48px serif';
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.fillText(message, canvas.width / 2, canvas.height / 2);
    }
}

function updatePlayer() {
    const prevY = player.y;

    player.x += player.dx;
    player.y += player.dy;
    // AJUSTE: Se redujo la gravedad para que el jugador caiga más lento.
    player.dy += 0.4;

    if (player.x + player.radius > canvas.width) player.x = canvas.width - player.radius;
    if (player.x - player.radius < 0) player.x = player.radius;
    
    player.onGround = false;

    platforms.forEach(platform => {
        const platformSurfaceY = platform.y;
        const platformBottomY = platformSurfaceY + platform.height;

        if (player.x + player.radius > platform.x && player.x - player.radius < platform.x + platform.width) {
            if (player.dy >= 0 && (player.y + player.radius) >= platformSurfaceY && (prevY + player.radius) <= platformSurfaceY) {
                player.dy = 0;
                player.y = platformSurfaceY - player.radius;
                player.onGround = true;
            }
            if (player.dy < 0 && (player.y - player.radius) <= platformBottomY && (prevY - player.radius) >= platformBottomY) {
                player.dy = 0;
                player.y = platformBottomY + player.radius;
            }
        }
    });

    if (player.y - player.radius > canvas.height){
        resetLevel();
    }
}


function updateBarrels() {
    barrels.forEach((barrel, index) => {
        barrel.y += barrel.dy;
        barrel.x += barrel.dx;

        if (barrel.x + 10 > canvas.width || barrel.x - 10 < 0) {
            barrel.dx *= -1;
        }

        if (barrel.y > canvas.height) {
            barrels.splice(index, 1);
        }

        let onAPlatform = false;
        platforms.forEach(platform => {
            if (
                !onAPlatform &&
                barrel.x > platform.x &&
                barrel.x < platform.x + platform.width &&
                barrel.y + 10 >= platform.y &&
                barrel.y - 10 < platform.y + platform.height
            ) {
                barrel.y = platform.y - 10;
                barrel.dy = 0;
                onAPlatform = true;
            }
        });

        if (!onAPlatform) {
            barrel.dy = barrelSpeed;
        }
    });
}

function checkCollisions() {
    barrels.forEach(barrel => {
        const dist = Math.hypot(player.x - barrel.x, player.y - barrel.y);
        if (dist < player.radius + 10) {
            resetLevel();
        }
    });

    if (
        player.x < enemy.x + enemy.width &&
        player.x + player.radius > enemy.x &&
        player.y < enemy.y + enemy.height &&
        player.y + player.radius > enemy.y
    ) {
        nextLevel();
    }
}

function resetLevel() {
    player.x = 100;
    player.y = 550;
    player.dx = 0;
    player.dy = 0;
    barrels = [];
    message = `Nivel ${level}`;
    levelStartTime = Date.now();
    showMessage();
}

function nextLevel() {
    level++;
    if (level > totalLevels) {
        const totalTime = ((Date.now() - gameStartTime) / 1000).toFixed(2);
        message = `¡Victoria! Fin del juego. Tiempo: ${totalTime}s`;
        gameRunning = false;
    } else {
        barrelSpeed += 0.5;
        resetLevel();
    }
}

function spawnBarrel() {
    if (gameRunning) {
        barrels.push({
            x: enemy.x + enemy.width / 2,
            y: enemy.y + enemy.height,
            dx: -barrelSpeed,
            dy: 0
        });
    }
}

function showMessage() {
    clearTimeout(messageTimeout);
    messageTimeout = setTimeout(() => {
        message = '';
    }, 2000);
}

function gameLoop() {
    if (!gameRunning && level > totalLevels) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawMessage();
        return;
    }
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawPlatforms();
    drawEnemy();
    drawPlayer();
    drawBarrels();
    drawMessage();

    if (gameRunning) {
        updatePlayer();
        updateBarrels();
        checkCollisions();
    }

    requestAnimationFrame(gameLoop);
}

function startGame() {
    gameRunning = true;
    gameStartTime = Date.now();
    levelStartTime = Date.now();
    message = `Nivel ${level}`;
    setupEnemyPosition();
    showMessage();
    setInterval(spawnBarrel, barrelSpawnRate);
    requestAnimationFrame(gameLoop);
}

document.addEventListener('keydown', e => {
    if (e.code === 'ArrowRight') {
        player.dx = player.speed;
    } else if (e.code === 'ArrowLeft') {
        player.dx = -player.speed;
    } else if (e.code === 'Space' && player.onGround) {
        player.dy = -player.jumpStrength;
    }
});

document.addEventListener('keyup', e => {
    if (e.code === 'ArrowRight' || e.code === 'ArrowLeft') {
        player.dx = 0;
    }
});

startGame();