// === Настройки ===
const DISPLAY_MULTIPLIER = 1e8; // 1 CT = 100 000 000
let realScore = parseInt(localStorage.getItem("score")) || 0;
let level = parseInt(localStorage.getItem("level")) || 1;

// === Отображение при загрузке ===
function displayScore(score) {
    document.getElementById("score").innerText = (score / DISPLAY_MULTIPLIER).toFixed(8);
}

document.getElementById("level").innerText = level;
displayScore(realScore);

// === Игра в кости ===
function rollDice() {
    const input = document.getElementById("betAmount");
    const betValue = parseFloat(input.value);

    if (isNaN(betValue) || betValue <= 0) {
        alert("Введите корректную сумму ставки!");
        return;
    }

    const betInCoins = Math.floor(betValue * DISPLAY_MULTIPLIER);

    if (betInCoins < 100) { // 0.00000100 CT
        alert("Минимальная ставка: 0.00000100 CT");
        return;
    }

    if (realScore < betInCoins) {
        alert("Недостаточно средств для ставки!");
        return;
    }

    // Генерируем число от 1 до 6
    const playerRoll = Math.floor(Math.random() * 6) + 1;
    const computerRoll = Math.floor(Math.random() * 6) + 1;

    let resultText = "";
    let change = 0;

    if (playerRoll > computerRoll) {
        change = betInCoins;
        realScore += change;
        resultText = `Вы выиграли! Выбросили ${playerRoll}, компьютер — ${computerRoll}`;
        addToHistory(`+${(change / DISPLAY_MULTIPLIER).toFixed(8)} CT (Dice Win)`);
        showNotification(`You won +${(change / DISPLAY_MULTIPLIER).toFixed(8)} CT`);
    } else if (playerRoll < computerRoll) {
        change = -betInCoins;
        realScore = Math.max(0, realScore + change);
        resultText = `Вы проиграли. Выбросили ${playerRoll}, компьютер — ${computerRoll}`;
        addToHistory(`-${(-change / DISPLAY_MULTIPLIER).toFixed(8)} CT (Dice Lose)`);
        showNotification(`You lost ${(-change / DISPLAY_MULTIPLIER).toFixed(8)} CT`);
    } else {
        resultText = `Ничья! Оба выбросили ${playerRoll}`;
    }

    // Сохраняем изменения
    localStorage.setItem("score", realScore);
    displayScore(realScore);
    updateProgress(realScore, level);
    document.getElementById("dice-result").innerText = resultText;

    input.value = ""; // Очищаем поле
}

// === Всплывающее уведомление ===
function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.innerText = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.classList.add('show');
    }, 100);

    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 4000);
}

// === Функции отображения счёта и прогресса ===
function displayScore(score) {
    document.getElementById("score").innerText = (score / DISPLAY_MULTIPLIER).toFixed(8);
}

function updateProgress(realScore, currentLevel) {
    const displayedScore = realScore / DISPLAY_MULTIPLIER;

    let nextLevelStart, currentLevelStart;

    switch (currentLevel) {
        case 1:
            currentLevelStart = 0.00000000;
            nextLevelStart = 0.00001000;
            break;
        case 2:
            currentLevelStart = 0.00001000;
            nextLevelStart = 0.00010000;
            break;
        case 3:
            currentLevelStart = 0.00010000;
            nextLevelStart = 0.00100000;
            break;
        case 4:
            currentLevelStart = 0.00100000;
            nextLevelStart = 0.01000000;
            break;
        case 5:
            currentLevelStart = 0.01000000;
            nextLevelStart = 0.10000000;
            break;
        case 6:
            currentLevelStart = 0.10000000;
            nextLevelStart = 1.00000000;
            break;
        default:
            currentLevelStart = Math.pow(10, currentLevel - 7);
            nextLevelStart = Math.pow(10, currentLevel - 6);
            break;
    }

    const progress = ((displayedScore - currentLevelStart) / (nextLevelStart - currentLevelStart)) * 100;
    const progressBar = document.getElementById("progress-fill");

    if (progressBar) {
        progressBar.style.width = Math.min(100, progress) + "%";
    }
}

// === История ===
let clickHistory = JSON.parse(localStorage.getItem("diceHistory")) || [];

function addToHistory(text) {
    const timestamp = new Date().toLocaleTimeString();
    clickHistory.push(`${timestamp} — ${text}`);

    if (clickHistory.length > 50) {
        clickHistory.shift();
    }

    localStorage.setItem("diceHistory", JSON.stringify(clickHistory));
    renderHistory();
}

function renderHistory() {
    const historyList = document.getElementById("history-list");
    historyList.innerHTML = "";

    for (let i = clickHistory.length - 1; i >= 0; i--) {
        const li = document.createElement("li");
        li.textContent = clickHistory[i];
        historyList.appendChild(li);
    }
}

// === Вернуться на главную ===
function goBack() {
    window.location.href = "index.html";
}