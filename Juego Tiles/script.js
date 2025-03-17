// Variables globales
let score = 0;
let gameStarted = false;
const gridSize = 16;
let blackTiles = [];
let timer;
let timeLeft = 10;
let currentMode = null;
let patternCount = 0;
let startTime;
let clickTimes = [];
let multiplier = 1;
let animationTimeouts = [];
let personalBests = {
    '10s': 0,
    'faster': 0,
    'patterns': 0,
    'rhythm': {
        120: 0,
        180: 0,
        240: 0,
        300: 0,
        360: 0
    }
};
const audioFiles = {
    120: new Audio('../rhythm-120.mp3'),
    180: new Audio('../rhythm-180.mp3'),
    240: new Audio('../rhythm-240.mp3'),
    300: new Audio('../rhythm-300.mp3'),
    360: new Audio('../rhythm-360.mp3')
};
let rhythmInterval;
let rhythmCounter = 0;
let tileNumbers = [];
let rhythmStarted = false;
let selectedBPM = 120;

// Elementos del DOM
const homeScreen = document.getElementById('home-screen');
const gameContainer = document.getElementById('game-container');
const grid = document.getElementById('grid');
const scoreDisplay = document.getElementById('score');
const startBtn = document.getElementById('start-btn');
const mode10sBtn = document.getElementById('mode-10s');
const modeFasterBtn = document.getElementById('mode-faster');
const modePatternsBtn = document.getElementById('mode-patterns');
const modeRhythmBtn = document.getElementById('mode-rhythm');
const homeBtn = document.getElementById('home-btn');
const bpmSelector = document.getElementById('bpm-selector');
const bpmButtons = document.querySelectorAll('.bpm-btn');
const homeTitle = document.getElementById('home-title');

// Crear la cuadrícula
function createGrid() {
    grid.innerHTML = '';
    for (let i = 0; i < gridSize; i++) {
        const tile = document.createElement('div');
        tile.classList.add('tile');
        tile.addEventListener('click', () => handleTileClick(i));
        tile.addEventListener('touchstart', (e) => {
            e.preventDefault();
            handleTileClick(i);
        });
        grid.appendChild(tile);
    }
}

// Seleccionar tiles negros
function setBlackTiles() {
    blackTiles = [];
    tileNumbers = [];
    const tiles = document.querySelectorAll('.tile');
    tiles.forEach(tile => {
        tile.style.backgroundColor = 'white';
        tile.textContent = '';
    });
    const tileCount = currentMode === 'rhythm' ? 4 : 3;
    while (blackTiles.length < tileCount) {
        const randomIndex = Math.floor(Math.random() * gridSize);
        if (!blackTiles.includes(randomIndex)) {
            blackTiles.push(randomIndex);
            tiles[randomIndex].style.backgroundColor = 'black';
            if (currentMode === 'rhythm') {
                tileNumbers.push(blackTiles.length);
                tiles[randomIndex].textContent = blackTiles.length;
            }
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

// Mover un tile negro
function moveSingleBlackTile(clickedIndex, newNumber = null) {
    const tiles = document.querySelectorAll('.tile');
    let newIndex;
    do {
        newIndex = Math.floor(Math.random() * gridSize);
    } while (blackTiles.includes(newIndex) || newIndex === clickedIndex);
    tiles[clickedIndex].style.backgroundColor = 'white';
    tiles[clickedIndex].textContent = '';
    tiles[newIndex].style.backgroundColor = 'black';
    const indexInArray = blackTiles.indexOf(clickedIndex);
    blackTiles[indexInArray] = newIndex;
    if (currentMode === 'rhythm' && newNumber !== null) {
        tileNumbers[indexInArray] = newNumber;
        tiles[newIndex].textContent = newNumber;
    }
}

// Manejar clic en tile
function handleTileClick(index) {
    if (!gameStarted || (currentMode === '10s' && timeLeft <= 0)) return;
    if (blackTiles.includes(index)) {
        const tiles = document.querySelectorAll('.tile');
        if (currentMode === '10s') {
            score++;
            scoreDisplay.textContent = `Score: ${score} | Time: ${timeLeft}s`;
            moveSingleBlackTile(index);
        } else if (currentMode === 'patterns') {
            blackTiles = blackTiles.filter(tile => tile !== index);
            tiles[index].style.backgroundColor = 'white';
            requestAnimationFrame(() => {
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
            });
        } else if (currentMode === 'faster') {
            const currentTime = Date.now();
            clickTimes.push(currentTime);
            const now = Date.now();
            const recentClicks = clickTimes.filter(time => now - time <= 1000);
            const cps = recentClicks.length > 1 ? (recentClicks.length / ((now - recentClicks[0]) / 1000)).toFixed(2) : 0.00;
            if (window.hasReached4Cps) {
                score += multiplier;
            }
            moveSingleBlackTile(index);
        } else if (currentMode === 'rhythm') {
            const tileIndex = blackTiles.indexOf(index);
            const currentNumber = parseInt(tiles[index].textContent);
            const minNumber = Math.min(...tileNumbers);
            if (!rhythmStarted && currentNumber === 1) {
                rhythmStarted = true;
                startRhythmInterval();
                score++;
                scoreDisplay.textContent = `Score: ${score}`;
                moveSingleBlackTile(index, Math.max(...tileNumbers) + 1);
            } else if (rhythmStarted && currentNumber === minNumber) {
                score++;
                scoreDisplay.textContent = `Score: ${score}`;
                moveSingleBlackTile(index, Math.max(...tileNumbers) + 1);
            } else {
                if (rhythmStarted) {
                    clearInterval(rhythmInterval);
                    audioFiles[selectedBPM].pause();
                    audioFiles[selectedBPM].currentTime = 0;
                }
                endGame();
            }
        }
    } else {
        clearInterval(timer);
        if (currentMode === 'rhythm' && rhythmStarted) {
            clearInterval(rhythmInterval);
            audioFiles[selectedBPM].pause();
            audioFiles[selectedBPM].currentTime = 0;
        }
        endGame();
    }
}

// Iniciar temporizador para "10s"
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

// Mostrar tiempo final en "Patterns"
function showFinalTime(time) {
    let finalTime = document.getElementById('final-time');
    if (!finalTime) {
        finalTime = document.createElement('div');
        finalTime.id = 'final-time';
        document.getElementById('grid').appendChild(finalTime);
    }
    finalTime.textContent = `${time}s`;
    finalTime.style.display = 'block';
    setTimeout(() => {
        finalTime.style.display = 'none';
        updatePersonalBest(time);
    }, 3000);
}

function updateMultiplier() {
    const now = Date.now();
    clickTimes = clickTimes.filter(time => now - time <= 1000);
    const cps = clickTimes.length;
    if (cps >= 4) {
        multiplier = 2;
    } else if (cps >= 3) {
        multiplier = 1.5;
    } else {
        multiplier = 1;
    }
}

// Terminar juego
function endGame() {
    gameStarted = false;
    rhythmStarted = false;
    startBtn.textContent = 'Start';
    const tiles = document.querySelectorAll('.tile');
    if (tiles.length === 0) return;
    for (let row = 0; row < 4; row++) {
        const rowTimeout = setTimeout(() => {
            for (let i = row * 4; i < (row + 1) * 4; i++) {
                if (tiles[i]) {
                    tiles[i].classList.add('red-transition');
                    tiles[i].style.backgroundColor = 'rgba(0, 0, 0, 0.4)';
                    tiles[i].textContent = '';
                    const fadeTimeout = setTimeout(() => {
                        if (tiles[i]) tiles[i].style.backgroundColor = 'rgb(255, 255, 255)';
                    }, 100);
                    animationTimeouts.push(fadeTimeout);
                }
            }
            if (row === 3 && document.getElementById('game-container').style.display === 'block') {
                showGameOver();
                if (currentMode !== 'patterns') {
                    updatePersonalBest(score);
                }
            }
        }, row * 250);
        animationTimeouts.push(rowTimeout);
    }
    clearInterval(timer);
}

// Mostrar "Game Over"
function showGameOver() {
    let gameOver = document.getElementById('game-over');
    if (!gameOver) {
        gameOver = document.createElement('div');
        gameOver.id = 'game-over';
        document.getElementById('grid').appendChild(gameOver); // Aseguramos que sea hijo de #grid
    }
    const isMobile = window.innerWidth < 600;
    gameOver.textContent = isMobile ? 'Game\nOver' : 'Game Over';
    gameOver.style.whiteSpace = 'pre-line';
    gameOver.style.display = 'block';
}

// Ocultar mensajes de fin
function hideGameOver() {
    const gameOver = document.getElementById('game-over');
    if (gameOver) gameOver.style.display = 'none';
    const finalTime = document.getElementById('final-time');
    if (finalTime) finalTime.style.display = 'none';
}

// Mostrar pantalla de juego
function showGameScreen() {
    homeScreen.style.display = 'none';
    gameContainer.style.display = 'block';
    bpmSelector.style.display = 'none';
    createGrid();
    grid.style.overflow = 'hidden';
    loadPersonalBests();
}

// Cargar PBs
function loadPersonalBests() {
    const savedPBs = localStorage.getItem('personalBests');
    if (savedPBs) {
        personalBests = JSON.parse(savedPBs);
    }
    let pbValue;
    if (currentMode === 'rhythm') {
        pbValue = personalBests[currentMode][selectedBPM] || 0;
    } else {
        pbValue = personalBests[currentMode] || 0;
    }
    document.getElementById('highscore-value').textContent = 
        pbValue > 0 ? `${pbValue}${currentMode === 'patterns' ? 's' : ''}` : '-';
}

// Actualizar PB
function updatePersonalBest(newScore) {
    const isPatterns = currentMode === 'patterns';
    let currentPB;
    if (currentMode === 'rhythm') {
        currentPB = personalBests[currentMode][selectedBPM] || 0;
    } else {
        currentPB = personalBests[currentMode] || (isPatterns ? Infinity : 0);
    }
    const isBetter = isPatterns ? newScore < currentPB : newScore > currentPB;
    if (isBetter) {
        if (currentMode === 'rhythm') {
            personalBests[currentMode][selectedBPM] = newScore;
        } else {
            personalBests[currentMode] = newScore;
        }
        localStorage.setItem('personalBests', JSON.stringify(personalBests));
        document.getElementById('highscore-value').textContent = 
            `${newScore}${isPatterns ? 's' : ''}`;
    }
}

// Iniciar intervalo de "Rhythm"
function startRhythmInterval() {
    const audio = audioFiles[selectedBPM];
    audio.currentTime = 0;
    audio.play();
    const beatInterval = 60000 / selectedBPM;
    rhythmInterval = setInterval(() => {
        rhythmCounter++;
        const tiles = document.querySelectorAll('.tile');
        let gameOver = false;
        blackTiles.forEach((tileIndex, i) => {
            if (tileNumbers[i] <= rhythmCounter) {
                gameOver = true;
            }
        });
        if (gameOver) {
            clearInterval(rhythmInterval);
            audio.pause();
            audio.currentTime = 0;
            endGame();
        }
    }, beatInterval);
}

// Iniciar "Rhythm"
function startRhythmMode() {
    score = 0;
    rhythmCounter = 0;
    rhythmStarted = false;
    scoreDisplay.textContent = `Score: ${score}`;
    setBlackTiles();
}

// Configurar modos
mode10sBtn.addEventListener('click', () => {
    currentMode = '10s';
    showGameScreen();
});

modeFasterBtn.addEventListener('click', () => {
    currentMode = 'faster';
    showGameScreen();
});

modePatternsBtn.addEventListener('click', () => {
    currentMode = 'patterns';
    showGameScreen();
});

modeRhythmBtn.addEventListener('click', () => {
    currentMode = 'rhythm';
    bpmSelector.style.display = 'flex';
    homeScreen.querySelectorAll('button:not(.bpm-btn)').forEach(btn => btn.style.display = 'none');
});

bpmButtons.forEach(button => {
    button.addEventListener('click', () => {
        selectedBPM = parseInt(button.getAttribute('data-bpm'));
        showGameScreen();
    });
});

// Refrescar página con el título
homeTitle.addEventListener('click', () => {
    location.reload();
});

// Iniciar/reiniciar
startBtn.addEventListener('click', () => {
    if (!gameStarted) {
        gameStarted = true;
        score = 0;
        timeLeft = 10;
        startBtn.textContent = 'Restart';
        animationTimeouts.forEach(timeout => clearTimeout(timeout));
        animationTimeouts = [];
        hideGameOver();
        const tiles = document.querySelectorAll('.tile');
        tiles.forEach(tile => {
            tile.style.backgroundColor = 'white';
            tile.classList.remove('red-transition');
            tile.textContent = '';
        });
        if (currentMode === '10s') {
            setBlackTiles();
            startTimer();
        } else if (currentMode === 'faster') {
            clickTimes = [];
            multiplier = 1;
            let gracePeriod = null;
            let graceTimeLeft = 3;
            window.hasReached4Cps = false;
            setBlackTiles();
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
                if (cps >= 4 && !window.hasReached4Cps) {
                    window.hasReached4Cps = true;
                }
                if (window.hasReached4Cps) {
                    if (cps < 4 && !gracePeriod) {
                        gracePeriod = setInterval(() => {
                            graceTimeLeft -= 0.1;
                            if (graceTimeLeft <= 0) {
                                clearInterval(gracePeriod);
                                clearInterval(timer);
                                endGame();
                            }
                        }, 100);
                    } else if (cps >= 4 && gracePeriod) {
                        clearInterval(gracePeriod);
                        gracePeriod = null;
                        graceTimeLeft = 3;
                    }
                }
            }, 100);
        } else if (currentMode === 'patterns') {
            patternCount = 0;
            startTime = Date.now();
            setBlackTilesPatterns();
            scoreDisplay.textContent = 'Click all black tiles!';
        } else if (currentMode === 'rhythm') {
            startRhythmMode();
        }
    } else {
        clearInterval(timer);
        if (currentMode === 'rhythm' && rhythmStarted) {
            clearInterval(rhythmInterval);
            audioFiles[selectedBPM].pause();
            audioFiles[selectedBPM].currentTime = 0;
        }
        gameStarted = false;
        rhythmStarted = false;
        startBtn.textContent = 'Start';
        animationTimeouts.forEach(timeout => clearTimeout(timeout));
        animationTimeouts = [];
        hideGameOver();
        grid.innerHTML = '';
        createGrid();
    }
});

// Volver a Home
homeBtn.addEventListener('click', () => {
    clearInterval(timer);
    if (currentMode === 'rhythm' && rhythmStarted) {
        clearInterval(rhythmInterval);
        audioFiles[selectedBPM].pause();
        audioFiles[selectedBPM].currentTime = 0;
    }
    gameStarted = false;
    rhythmStarted = false;
    startBtn.textContent = 'Start';
    animationTimeouts.forEach(timeout => clearTimeout(timeout));
    animationTimeouts = [];
    hideGameOver();
    grid.innerHTML = '';
    gameContainer.style.display = 'none';
    homeScreen.style.display = 'flex';
    homeScreen.querySelectorAll('button:not(.bpm-btn)').forEach(btn => btn.style.display = 'block');
    bpmSelector.style.display = 'none';
});

// Inicializar
loadPersonalBests();
hideGameOver();