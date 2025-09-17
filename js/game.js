/**
 * @file Archivo principal del juego tipo Donkey Kong.
 * @description Contiene toda la lógica del juego, incluyendo el renderizado,
 * físicas del jugador, movimiento de barriles, colisiones y control de niveles.
 */

// --- CONFIGURACIÓN INICIAL DEL CANVAS ---
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// --- VARIABLES GLOBALES DEL ESTADO DEL JUEGO ---
let level = 1; // Nivel actual del juego.
const totalLevels = 8; // Cantidad total de niveles para ganar.
let gameStartTime; // Almacena el momento en que inicia el juego para el cronómetro final.
let message = `Nivel ${level}`; // Mensaje que se muestra en pantalla (ej. "Nivel 1").
let messageTimeout; // Temporizador para ocultar los mensajes después de un tiempo.
let gameRunning = false; // Booleano que controla si el juego está en curso o pausado (ej. en la pantalla de victoria).

// --- OBJETOS PRINCIPALES DEL JUEGO ---

/**
 * @description Objeto que representa al jugador.
 * @property {number} x - Posición horizontal.
 * @property {number} y - Posición vertical.
 * @property {number} radius - Radio del círculo del jugador.
 * @property {number} dx - Velocidad horizontal.
 * @property {number} dy - Velocidad vertical.
 * @property {number} speed - Velocidad de movimiento al presionar las flechas.
 * @property {number} jumpStrength - Fuerza del salto (velocidad vertical inicial negativa).
 * @property {boolean} onGround - Verdadero si el jugador está sobre una plataforma.
 */
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

/**
 * @description Objeto que representa al enemigo que lanza los barriles.
 */
const enemy = {
    x: canvas.width - 100,
    y: 50, // La posición Y se ajustará dinámicamente.
    width: 40,
    height: 40
};

/**
 * @description Array de objetos que define las plataformas del juego.
 * @property {number} x - Posición horizontal de inicio.
 * @property {number} y - Posición vertical.
 * @property {number} width - Ancho de la plataforma.
 * @property {number} height - Alto de la plataforma.
 * @property {number} incline - Inclinación (0 para plataformas rectas).
 */
const platforms = [
    { x: 0, y: 580, width: 600, height: 20, incline: 0 },
    { x: 200, y: 480, width: 600, height: 20, incline: 0 },
    { x: 0, y: 380, width: 600, height: 20, incline: 0 },
    { x: 200, y: 280, width: 600, height: 20, incline: 0 },
    { x: 0, y: 180, width: 600, height: 20, incline: 0 },
    { x: 200, y: 80, width: 600, height: 20, incline: 0 }
];

// --- VARIABLES DE LOS BARRILES ---
let barrels = []; // Array que contendrá todos los barriles en pantalla.
let barrelSpeed = 1.5; // Velocidad de los barriles (aumenta con cada nivel).
let barrelSpawnRate = 2000; // Tiempo en milisegundos entre la aparición de cada barril.


// --- FUNCIONES DE INICIALIZACIÓN Y CONFIGURACIÓN ---

/**
 * @description Calcula y establece la posición 'y' del enemigo para que se sitúe
 * perfectamente sobre la plataforma más alta.
 */
function setupEnemyPosition() {
    const topPlatform = platforms[platforms.length - 1];
    enemy.y = topPlatform.y - enemy.height;
}


// --- FUNCIONES DE DIBUJADO (RENDERIZADO) ---

/** @description Dibuja al jugador (un círculo azul) en el canvas. */
function drawPlayer() {
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
    ctx.fillStyle = 'blue';
    ctx.fill();
    ctx.closePath();
}

/** @description Dibuja al enemigo (un cuadrado rojo) en el canvas. */
function drawEnemy() {
    ctx.fillStyle = 'red';
    ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
}

/** @description Dibuja todas las plataformas (rectángulos verdes) en el canvas. */
function drawPlatforms() {
    ctx.fillStyle = 'green';
    platforms.forEach(platform => {
        ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
    });
}

/** @description Dibuja todos los barriles (círculos marrones) en el canvas. */
function drawBarrels() {
    ctx.fillStyle = 'brown';
    barrels.forEach(barrel => {
        ctx.beginPath();
        ctx.arc(barrel.x, barrel.y, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.closePath();
    });
}

/** @description Dibuja el mensaje actual en el centro de la pantalla. */
function drawMessage() {
    if (message) {
        ctx.font = '48px serif';
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.fillText(message, canvas.width / 2, canvas.height / 2);
    }
}


// --- FUNCIONES DE ACTUALIZACIÓN (LÓGICA DEL JUEGO) ---

/**
 * @description Actualiza la posición del jugador, aplica la gravedad y gestiona las colisiones con las plataformas.
 */
function updatePlayer() {
    const prevY = player.y; // Guarda la posición Y anterior para una colisión más precisa.

    // Aplica velocidad y gravedad
    player.x += player.dx;
    player.y += player.dy;
    player.dy += 0.4; // Valor de gravedad (más bajo para una caída lenta).

    // Colisiones con los bordes del canvas
    if (player.x + player.radius > canvas.width) player.x = canvas.width - player.radius;
    if (player.x - player.radius < 0) player.x = player.radius;
    
    player.onGround = false; // Asume que no está en el suelo hasta que se detecte una colisión.

    // Lógica de colisión con cada plataforma
    platforms.forEach(platform => {
        if (player.x + player.radius > platform.x && player.x - player.radius < platform.x + platform.width) {
            // 1. Aterrizaje sobre la plataforma (cayendo)
            if (player.dy >= 0 && (player.y + player.radius) >= platform.y && (prevY + player.radius) <= platform.y) {
                player.dy = 0;
                player.y = platform.y - player.radius;
                player.onGround = true;
            }
            // 2. Golpe con la parte inferior de la plataforma (saltando)
            if (player.dy < 0 && (player.y - player.radius) <= (platform.y + platform.height) && (prevY - player.radius) >= (platform.y + platform.height)) {
                player.dy = 0; // Detiene el salto.
                player.y = platform.y + platform.height + player.radius;
            }
        }
    });

    // Si el jugador cae fuera del mapa, se reinicia el nivel.
    if (player.y - player.radius > canvas.height){
        resetLevel();
    }
}

/**
 * @description Actualiza la posición de los barriles, su caída y su rodadura sobre las plataformas.
 */
function updateBarrels() {
    barrels.forEach((barrel, index) => {
        // Aplica velocidad vertical y horizontal
        barrel.y += barrel.dy;
        barrel.x += barrel.dx;

        // Rebote con las paredes laterales
        if (barrel.x + 10 > canvas.width || barrel.x - 10 < 0) {
            barrel.dx *= -1;
        }

        // Elimina el barril si cae fuera de la pantalla
        if (barrel.y > canvas.height) {
            barrels.splice(index, 1);
        }

        let onAPlatform = false;
        // Comprueba si está en contacto con alguna plataforma
        platforms.forEach(platform => {
            if (!onAPlatform && barrel.x > platform.x && barrel.x < platform.x + platform.width && barrel.y + 10 >= platform.y && barrel.y - 10 < platform.y + platform.height) {
                barrel.y = platform.y - 10;
                barrel.dy = 0; // Detiene la caída.
                onAPlatform = true;
            }
        });

        // Si no está sobre una plataforma, cae.
        if (!onAPlatform) {
            barrel.dy = barrelSpeed;
        }
    });
}

/**
 * @description Verifica las colisiones entre el jugador y los barriles, y entre el jugador y el enemigo.
 */
function checkCollisions() {
    // Colisión jugador-barril
    barrels.forEach(barrel => {
        const dist = Math.hypot(player.x - barrel.x, player.y - barrel.y); // Distancia entre centros
        if (dist < player.radius + 10) {
            resetLevel(); // Si chocan, reinicia el nivel.
        }
    });

    // Colisión jugador-enemigo
    if (player.x < enemy.x + enemy.width && player.x + player.radius > enemy.x && player.y < enemy.y + enemy.height && player.y + player.radius > enemy.y) {
        nextLevel(); // Si lo toca, pasa al siguiente nivel.
    }
}


// --- FUNCIONES DE CONTROL DEL JUEGO ---

/**
 * @description Reinicia la posición del jugador y los barriles al estado inicial del nivel actual.
 */
function resetLevel() {
    player.x = 100;
    player.y = 550;
    player.dx = 0;
    player.dy = 0;
    barrels = [];
    message = `Nivel ${level}`;
    showMessage();
}

/**
 * @description Avanza al siguiente nivel o muestra la pantalla de victoria si se completan todos.
 */
function nextLevel() {
    level++;
    if (level > totalLevels) {
        // AJUSTE: Muestra el tiempo en minutos y segundos.
        const totalSeconds = Math.floor((Date.now() - gameStartTime) / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        message = `¡Victoria! Tiempo: ${minutes}m ${seconds}s`;
        gameRunning = false;
    } else {
        barrelSpeed += 0.5; // Aumenta la dificultad.
        resetLevel();
    }
}

/**
 * @description Crea un nuevo barril en la posición del enemigo.
 */
function spawnBarrel() {
    if (gameRunning) {
        barrels.push({
            x: enemy.x + enemy.width / 2,
            y: enemy.y + enemy.height,
            dx: -barrelSpeed, // Velocidad de rodadura inicial.
            dy: 0
        });
    }
}

/**
 * @description Muestra un mensaje en pantalla y lo oculta después de 2 segundos.
 */
function showMessage() {
    clearTimeout(messageTimeout);
    messageTimeout = setTimeout(() => {
        message = '';
    }, 2000);
}

/**
 * @description El bucle principal del juego. Limpia, dibuja y actualiza todos los elementos en cada frame.
 */
function gameLoop() {
    // Si el juego ha terminado, solo dibuja el mensaje final.
    if (!gameRunning && level > totalLevels) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawMessage();
        return;
    }
    
    // 1. Limpiar el canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 2. Dibujar todos los elementos
    drawPlatforms();
    drawEnemy();
    drawPlayer();
    drawBarrels();
    drawMessage();

    // 3. Actualizar la lógica solo si el juego está corriendo
    if (gameRunning) {
        updatePlayer();
        updateBarrels();
        checkCollisions();
    }

    // Solicita al navegador que vuelva a llamar a gameLoop para el siguiente frame.
    requestAnimationFrame(gameLoop);
}

/**
 * @description Inicia el juego, establece las variables iniciales y comienza el bucle del juego.
 */
function startGame() {
    gameRunning = true;
    gameStartTime = Date.now();
    message = `Nivel ${level}`;
    setupEnemyPosition(); // Posiciona al enemigo correctamente.
    showMessage();
    setInterval(spawnBarrel, barrelSpawnRate); // Inicia la creación de barriles.
    requestAnimationFrame(gameLoop); // Inicia el bucle del juego.
}


// --- MANEJADORES DE EVENTOS (ENTRADA DEL USUARIO) ---

/**
 * @description Escucha las teclas que se presionan para mover al jugador.
 */
document.addEventListener('keydown', e => {
    if (e.code === 'ArrowRight') {
        player.dx = player.speed;
    } else if (e.code === 'ArrowLeft') {
        player.dx = -player.speed;
    } else if (e.code === 'Space' && player.onGround) {
        player.dy = -player.jumpStrength;
    }
});

/**
 * @description Escucha cuando se sueltan las teclas de movimiento para detener al jugador.
 */
document.addEventListener('keyup', e => {
    if (e.code === 'ArrowRight' || e.code === 'ArrowLeft') {
        player.dx = 0;
    }
});

// --- INICIO DEL JUEGO ---
startGame();