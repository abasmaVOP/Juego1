// Variables globales
let score = 0;
let gameStarted = false;
const gridSize = 16; // 4x4
let blackTiles = [];
let timer;
let timeLeft = 10;
let currentMode = null;
let patternCount = 0; // Contador de patrones completados
let startTime; // Para medir el tiempo total en Patterns
let clickTimes = []; // Array para registrar los tiempos de los clics
let multiplier = 1; // Multiplicador inicial

// Elementos del DOM
const homeScreen = document.getElementById('home-screen');
const gameContainer = document.getElementById('game-container');
const grid = document.getElementById('grid');
const scoreDisplay = document.getElementById('score');
const startBtn = document.getElementById('start-btn');
const mode10sBtn = document.getElementById('mode-10s');
const modeFasterBtn = document.getElementById('mode-faster');
const modePatternsBtn = document.getElementById('mode-patterns');
const homeBtn = document.getElementById('home-btn');

// Crear la cuadrícula
function createGrid() {
    grid.innerHTML = '';
    for (let i = 0; i < gridSize; i++) {
        const tile = document.createElement('div');
        tile.classList.add('tile');
        // Evento para PC (click)
        tile.addEventListener('click', () => handleTileClick(i));
        // Eventos táctiles para móvil
        tile.addEventListener('touchstart', (e) => {
            e.preventDefault(); // Evitar comportamiento por defecto (como scroll o zoom)
            handleTileClick(i);
        });
        grid.appendChild(tile);
    }
}

// Seleccionar 3 tiles negros aleatorios
function setBlackTiles() {
    blackTiles = [];
    const tiles = document.querySelectorAll('.tile');
    tiles.forEach(tile => tile.style.backgroundColor = 'white');
    while (blackTiles.length < 3) {
        const randomIndex = Math.floor(Math.random() * gridSize);
        if (!blackTiles.includes(randomIndex)) {
            blackTiles.push(randomIndex);
            tiles[randomIndex].style.backgroundColor = 'black';
        }
    }
}

function setBlackTilesPatterns() {
    blackTiles = [];
    const tiles = document.querySelectorAll('.tile');
    tiles.forEach(tile => tile.style.backgroundColor = 'white');
    while (blackTiles.length < 4) {
        const randomIndex = Math.floor(Math.random() * gridSize);
        if (!blackTiles.includes(randomIndex)) {
            blackTiles.push(randomIndex);
            tiles[randomIndex].style.backgroundColor = 'black';
        }
    }
}

// Mover solo el tile negro clicado
function moveSingleBlackTile(clickedIndex) {
    const tiles = document.querySelectorAll('.tile');
    let newIndex;

    do {
        newIndex = Math.floor(Math.random() * gridSize);
    } while (blackTiles.includes(newIndex) || newIndex === clickedIndex);

    tiles[clickedIndex].style.backgroundColor = 'white';
    tiles[newIndex].style.backgroundColor = 'black';

    const indexInArray = blackTiles.indexOf(clickedIndex);
    blackTiles[indexInArray] = newIndex;
}

// Manejar clic en un tile
function handleTileClick(index) {
    if (!gameStarted || (currentMode === '10s' && timeLeft <= 0)) return;

    if (blackTiles.includes(index)) {
        if (currentMode === '10s') {
            score++;
            scoreDisplay.textContent = `Score: ${score} | Time: ${timeLeft}s`;
            moveSingleBlackTile(index);
        } else if (currentMode === 'patterns') {
            blackTiles = blackTiles.filter(tile => tile !== index);
            const tiles = document.querySelectorAll('.tile');
            tiles[index].style.backgroundColor = 'white';

            if (blackTiles.length === 0) {
                patternCount++;
                if (patternCount < 10) {
                    setBlackTilesPatterns();
                } else {
                    const endTime = Date.now();
                    const totalTime = ((endTime - startTime) / 1000).toFixed(2);
                    gameStarted = false;
                    startBtn.textContent = 'Start';
                    showFinalTime(totalTime);
                }
            }
        } else if (currentMode === 'faster') {
            const currentTime = Date.now();
            clickTimes.push(currentTime);
            // Solo sumar puntos si ya se alcanzó 4 CPS (controlado por hasReached4Cps)
            const now = Date.now();
            const recentClicks = clickTimes.filter(time => now - time <= 1000);
            const cps = recentClicks.length > 1 ? (recentClicks.length / ((now - recentClicks[0]) / 1000)).toFixed(2) : 0.00;
            // Usar una variable externa para verificar hasReached4Cps (se definirá en startBtn)
            if (window.hasReached4Cps) { // Sumar puntos solo si ya se alcanzó 4 CPS
                score += multiplier;
            }
            moveSingleBlackTile(index); // Mover solo el tile clicado
        }
    } else {
        clearInterval(timer);
        endGame();
    }
}


// Iniciar el temporizador para el modo "10 Seconds"
function startTimer() {
    timeLeft = 10;
    scoreDisplay.textContent = `Score: ${score} | Time: ${timeLeft}s`;
    timer = setInterval(() => {
        timeLeft--;
        scoreDisplay.textContent = `Score: ${score} | Time: ${timeLeft}s`;
        if (timeLeft <= 0) {
            clearInterval(timer);
            endGame();
        }
    }, 1000);
}

// Nueva función para mostrar el tiempo final
function showFinalTime(time) {
    let finalTime = document.getElementById('final-time');
    if (!finalTime) {
        finalTime = document.createElement('div');
        finalTime.id = 'final-time';
        document.body.appendChild(finalTime);
    }
    finalTime.textContent = `${time}s`;
    finalTime.style.display = 'block';
    setTimeout(() => {
        finalTime.style.display = 'none'; // Ocultar después de 3 segundos
    }, 3000);
}

function updateMultiplier() {
    const now = Date.now();
    clickTimes = clickTimes.filter(time => now - time <= 1000);
    const cps = clickTimes.length; // Usamos entero para el multiplicador
    if (cps >= 4) {
        multiplier = 2;
    } else if (cps >= 3) {
        multiplier = 1.5;
    } else {
        multiplier = 1;
    }
}


// Terminar el juego con animación
function endGame() {
    gameStarted = false;
    startBtn.textContent = 'Start';
    const tiles = document.querySelectorAll('.tile');
    
    for (let row = 0; row < 4; row++) {
        setTimeout(() => {
            for (let i = row * 4; i < (row + 1) * 4; i++) {
                tiles[i].classList.add('red-transition');
                tiles[i].style.backgroundColor = 'rgba(255, 0, 0, 0.3)';
                setTimeout(() => {
                    tiles[i].style.backgroundColor = 'rgba(255, 0, 0, 1)';
                }, 100);
            }
            if (row === 3) {
                showGameOver();
            }
        }, row * 250);
    }
}

// Mostrar mensaje de Game Over
function showGameOver() {
    let gameOver = document.getElementById('game-over');
    if (!gameOver) {
        gameOver = document.createElement('div');
        gameOver.id = 'game-over';
        gameOver.textContent = 'Game Over';
        document.body.appendChild(gameOver);
    }
    gameOver.style.display = 'block';
}

// Ocultar mensaje de Game Over
function hideGameOver() {
    const gameOver = document.getElementById('game-over');
    if (gameOver) {
        gameOver.style.display = 'none';
    }
    const finalTime = document.getElementById('final-time');
    if (finalTime) {
        finalTime.style.display = 'none';
    }
}

// Mostrar pantalla de juego
function showGameScreen() {
    homeScreen.style.display = 'none';
    gameContainer.style.display = 'block';
    createGrid();
}

// Configurar modo "10 Seconds"
mode10sBtn.addEventListener('click', () => {
    currentMode = '10s';
    showGameScreen();
});

// Configurar modo "Faster" (placeholder)
modeFasterBtn.addEventListener('click', () => {
    currentMode = 'faster';
    showGameScreen();
});

// Configurar modo "Patterns"
modePatternsBtn.addEventListener('click', () => {
    currentMode = 'patterns';
    showGameScreen();
});

// Iniciar o reiniciar el juego
startBtn.addEventListener('click', () => {
    if (!gameStarted) {
        gameStarted = true;
        score = 0;
        timeLeft = 10;
        startBtn.textContent = 'Restart';
        hideGameOver();
        if (currentMode === '10s') {
            setBlackTiles();
            startTimer();
        } else if (currentMode === 'faster') {
            clickTimes = []; // Reiniciar tiempos de clics
            multiplier = 1; // Reiniciar multiplicador
            let gracePeriod = null; // Temporizador de tolerancia
            let graceTimeLeft = 3; // 3 segundos de tolerancia
            window.hasReached4Cps = false; // Hacerlo global para acceder desde handleTileClick
            setBlackTiles(); // 3 tiles negros como en 10s
            scoreDisplay.textContent = `Score: ${score} | CPS: 0.00 | x${multiplier}`;
            timer = setInterval(() => {
                const now = Date.now();
                clickTimes = clickTimes.filter(time => now - time <= 1000);
                let cps = 0.00;
                if (clickTimes.length > 1) {
                    const timeWindow = (now - clickTimes[0]) / 1000;
                    cps = (clickTimes.length / timeWindow).toFixed(2);
                }
                updateMultiplier();
                scoreDisplay.textContent = `Score: ${score} | CPS: ${cps} | x${multiplier}`;

                // Verificar si se alcanzó 4 CPS por primera vez
                if (cps >= 4 && !window.hasReached4Cps) {
                    window.hasReached4Cps = true;
                }

                // Manejar grace period
                if (window.hasReached4Cps) {
                    if (cps < 4 && !gracePeriod) {
                        // Iniciar grace period solo si CPS baja de 4 y no hay uno activo
                        gracePeriod = setInterval(() => {
                            graceTimeLeft -= 0.1;
                            if (graceTimeLeft <= 0) {
                                clearInterval(gracePeriod);
                                clearInterval(timer);
                                endGame();
                            }
                        }, 100); // Actualizar tolerancia cada 100ms
                    } else if (cps >= 4 && gracePeriod) {
                        // Si CPS sube a 4+ y hay un grace period, limpiarlo y reiniciar
                        clearInterval(gracePeriod);
                        gracePeriod = null;
                        graceTimeLeft = 3; // Reiniciar a 3 segundos
                    }
                }
            }, 100); // Actualizar CPS cada 100ms
        } else {
            clearInterval(timer);
            gameStarted = false;
            startBtn.textContent = 'Start';
            hideGameOver();
            grid.innerHTML = '';
            createGrid();
        }
    }
});

// Volver a la pantalla de Home
homeBtn.addEventListener('click', () => {
    clearInterval(timer);
    gameStarted = false;
    startBtn.textContent = 'Start';
    hideGameOver();
    grid.innerHTML = '';
    gameContainer.style.display = 'none';
    homeScreen.style.display = 'flex';
});

// Inicializar en la pantalla de Home
hideGameOver();