/**
 * @file Archivo principal del juego tipo Donkey Kong.
 * @description Contiene toda la lógica del juego, incluyendo el renderizado,
 * físicas del jugador, movimiento de barriles, colisiones y control de niveles.
 */

// --- CONFIGURACIÓN INICIAL DEL CANVAS ---
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// --- VARIABLES GLOBALES DEL ESTADO DEL JUEGO ---
let level = 1;
const totalLevels = 8;
let gameStartTime; // Almacena el momento en que inicia TODA la partida.
let message = '';
let messageTimeout;
let gameRunning = false;

// --- OBJETOS PRINCIPALES DEL JUEGO ---

/** @description Objeto que representa al jugador. */
const player = {
    x: 100,
    y: 550,
    radius: 15,
    dx: 0,
    dy: 0,
    speed: 5,
    jumpStrength: 12,
    onGround: false
};

/** @description Objeto que representa al enemigo. */
const enemy = {
    x: canvas.width - 100,
    y: 50,
    width: 40,
    height: 40
};

/** @description Array de objetos que define las plataformas del juego. */
const platforms = [
    { x: 0, y: 580, width: 600, height: 20, incline: 0 },
    { x: 200, y: 480, width: 600, height: 20, incline: 0 },
    { x: 0, y: 380, width: 600, height: 20, incline: 0 },
    { x: 200, y: 280, width: 600, height: 20, incline: 0 },
    { x: 0, y: 180, width: 600, height: 20, incline: 0 },
    { x: 200, y: 80, width: 600, height: 20, incline: 0 }
];

// --- VARIABLES DE LOS BARRILES ---
let barrels = [];
let barrelSpeed = 1.5;
let barrelSpawnRate = 2000;
let barrelInterval;

// --- FUNCIONES DE INICIALIZACIÓN Y CONFIGURACIÓN ---

/** @description Calcula y establece la posición 'y' del enemigo sobre la plataforma más alta. */
function setupEnemyPosition() {
    const topPlatform = platforms[platforms.length - 1];
    enemy.y = topPlatform.y - enemy.height;
}

// --- FUNCIONES DE DIBUJADO (RENDERIZADO) ---

/** @description Dibuja la pantalla de inicio. */
function drawStartScreen() {
    drawPlatforms();
    drawEnemy();
    ctx.font = "30px 'Press Start 2P'";
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.fillText('Toca para empezar a jugar', canvas.width / 2, canvas.height / 2);
}

/** @description Dibuja al jugador. */
function drawPlayer() {
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
    ctx.fillStyle = 'blue';
    ctx.fill();
    ctx.closePath();
}

/** @description Dibuja al enemigo. */
function drawEnemy() {
    ctx.fillStyle = 'red';
    ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
}

/** @description Dibuja todas las plataformas. */
function drawPlatforms() {
    ctx.fillStyle = 'green';
    platforms.forEach(platform => {
        ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
    });
}

/** @description Dibuja todos los barriles. */
function drawBarrels() {
    ctx.fillStyle = 'brown';
    barrels.forEach(barrel => {
        ctx.beginPath();
        ctx.arc(barrel.x, barrel.y, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.closePath();
    });
}

/** @description Dibuja el mensaje de nivel en el centro. */
function drawMessage() {
    if (message) {
        ctx.font = "30px 'Press Start 2P'";
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.fillText(message, canvas.width / 2, canvas.height / 2);
    }
}

/** @description Dibuja el cronómetro global en tiempo real. */
function drawTimer() {
    if (!gameRunning) return;

    // AJUSTE: Se usa gameStartTime para que el contador sea global y no se reinicie.
    const totalSeconds = Math.floor((Date.now() - gameStartTime) / 1000);
    const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
    const seconds = (totalSeconds % 60).toString().padStart(2, '0');

    ctx.font = "24px 'Press Start 2P'";
    ctx.fillStyle = 'yellow';
    ctx.textAlign = 'right';
    ctx.fillText(`${minutes}:${seconds}`, canvas.width - 20, 40);
}

/** @description Dibuja las instrucciones del nivel a la izquierda. */
function drawInstructions() {
    ctx.font = "12px 'Press Start 2P'";
    ctx.fillStyle = '#ccc';
    ctx.textAlign = 'left';
    ctx.fillText('Para pasar al siguiente', 20, 40);
    ctx.fillText('nivel toca el cuadro rojo.', 20, 60);
}

// --- FUNCIONES DE ACTUALIZACIÓN (LÓGICA DEL JUEGO) ---

/** @description Actualiza la posición del jugador y gestiona colisiones. */
function updatePlayer() {
    const prevY = player.y;
    player.x += player.dx;
    player.y += player.dy;
    player.dy += 0.4;
    if (player.x + player.radius > canvas.width) player.x = canvas.width - player.radius;
    if (player.x - player.radius < 0) player.x = player.radius;
    player.onGround = false;
    platforms.forEach(platform => {
        if (player.x + player.radius > platform.x && player.x - player.radius < platform.x + platform.width) {
            if (player.dy >= 0 && (player.y + player.radius) >= platform.y && (prevY + player.radius) <= platform.y) {
                player.dy = 0;
                player.y = platform.y - player.radius;
                player.onGround = true;
            }
            if (player.dy < 0 && (player.y - player.radius) <= (platform.y + platform.height) && (prevY - player.radius) >= (platform.y + platform.height)) {
                player.dy = 0;
                player.y = platform.y + platform.height + player.radius;
            }
        }
    });
    if (player.y - player.radius > canvas.height) resetLevel();
}

/** @description Actualiza la posición de los barriles. */
function updateBarrels() {
    barrels.forEach((barrel, index) => {
        barrel.y += barrel.dy;
        barrel.x += barrel.dx;
        if (barrel.x + 10 > canvas.width || barrel.x - 10 < 0) barrel.dx *= -1;
        if (barrel.y > canvas.height) barrels.splice(index, 1);
        let onAPlatform = false;
        platforms.forEach(platform => {
            if (!onAPlatform && barrel.x > platform.x && barrel.x < platform.x + platform.width && barrel.y + 10 >= platform.y && barrel.y - 10 < platform.y + platform.height) {
                barrel.y = platform.y - 10;
                barrel.dy = 0;
                onAPlatform = true;
            }
        });
        if (!onAPlatform) barrel.dy = barrelSpeed;
    });
}

/** @description Verifica las colisiones entre entidades. */
function checkCollisions() {
    barrels.forEach(barrel => {
        if (Math.hypot(player.x - barrel.x, player.y - barrel.y) < player.radius + 10) resetLevel();
    });
    if (player.x < enemy.x + enemy.width && player.x + player.radius > enemy.x && player.y < enemy.y + enemy.height && player.y + player.radius > enemy.y) nextLevel();
}

// --- FUNCIONES DE CONTROL DEL JUEGO ---

/** @description Reinicia el nivel actual. */
function resetLevel() {
    player.x = 100;
    player.y = 550;
    player.dx = 0;
    player.dy = 0;
    barrels = [];
    message = `Nivel ${level}`;
    showMessage();
}

/** @description Avanza al siguiente nivel o finaliza el juego. */
function nextLevel() {
    level++;
    if (level > totalLevels) {
        const totalSeconds = Math.floor((Date.now() - gameStartTime) / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        message = `¡Victoria! Tiempo: ${minutes}m ${seconds}s`;
        gameRunning = false;
        clearInterval(barrelInterval);
    } else {
        barrelSpeed += 0.5;
        resetLevel();
    }
}

/** @description Crea un nuevo barril. */
function spawnBarrel() {
    if (gameRunning) barrels.push({ x: enemy.x + enemy.width / 2, y: enemy.y + enemy.height, dx: -barrelSpeed, dy: 0 });
}

/** @description Muestra un mensaje temporalmente. */
function showMessage() {
    clearTimeout(messageTimeout);
    messageTimeout = setTimeout(() => { message = ''; }, 2000);
}

/** @description El bucle principal del juego. Dibuja y actualiza todo. */
function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!gameRunning) {
        if (level > totalLevels) {
            drawPlatforms();
            drawEnemy();
            drawMessage();
        } else {
            drawStartScreen();
        }
    } else {
        drawPlatforms();
        drawEnemy();
        drawPlayer();
        drawBarrels();
        drawMessage();
        drawTimer();
        drawInstructions();

        updatePlayer();
        updateBarrels();
        checkCollisions();
    }

    requestAnimationFrame(gameLoop);
}

/** @description Inicia el juego. */
function startGame() {
    if (gameRunning) return;
    gameRunning = true;
    gameStartTime = Date.now(); // El tiempo global se inicia aquí una sola vez.
    message = `Nivel ${level}`;
    showMessage();
    barrelInterval = setInterval(spawnBarrel, barrelSpawnRate);
}

// --- MANEJADORES DE EVENTOS ---

document.addEventListener('keydown', e => {
    if (!gameRunning) return;
    if (e.code === 'ArrowRight') player.dx = player.speed;
    else if (e.code === 'ArrowLeft') player.dx = -player.speed;
    else if (e.code === 'Space' && player.onGround) player.dy = -player.jumpStrength;
});

document.addEventListener('keyup', e => {
    if (e.code === 'ArrowRight' || e.code === 'ArrowLeft') player.dx = 0;
});

canvas.addEventListener('click', () => {
    if (!gameRunning && level <= totalLevels) {
        startGame();
    }
});

// --- INICIO DEL JUEGO ---
setupEnemyPosition();
requestAnimationFrame(gameLoop);