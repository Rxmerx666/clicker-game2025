// === Загружаем данные из localStorage ===
const DISPLAY_MULTIPLIER = 1e8;
let realScore = parseInt(localStorage.getItem("score")) || 0;
let level = parseInt(localStorage.getItem("level")) || 1;

// === Обновляем интерфейс при загрузке ===
function displayScore(score) {
    document.getElementById("score").innerText = (score / DISPLAY_MULTIPLIER).toFixed(8);
}

document.getElementById("level").innerText = level;
displayScore(realScore);

// === Минимальная ставка ===
let fixedBet = localStorage.getItem("fixedBet") ? parseFloat(localStorage.getItem("fixedBet")) : null;

// === Функция фиксированной ставки ===
function setFixedBet() {
    const input = document.getElementById("fixedBetInput");
    const value = parseFloat(input.value);

    if (isNaN(value) || value <= 0) {
        alert("Введите корректную сумму ставки!");
        return;
    }

    fixedBet = value;
    localStorage.setItem("fixedBet", fixedBet);
    showNotification(`Ставка зафиксирована: ${fixedBet.toFixed(8)} CT`);
}

// === Игра "Камень-Ножницы-Бумага" ===
function playGame(playerChoice) {
    const input = document.getElementById("betAmount");
    let betValue;

    if (fixedBet !== null && fixedBet > 0) {
        betValue = fixedBet;
        input.value = fixedBet.toFixed(8);
    } else {
        betValue = parseFloat(input.value);
    }

    if (isNaN(betValue) || betValue <= 0) {
        alert("Введите корректную сумму ставки!");
        return;
    }

    const betInCoins = Math.floor(betValue * DISPLAY_MULTIPLIER);

    if (betInCoins < 100) {
        alert("Минимальная ставка: 0.00000100 CT");
        return;
    }

    if (realScore < betInCoins) {
        alert("Недостаточно средств для ставки!");
        return;
    }

    const choices = ['rock', 'paper', 'scissors'];
    const computerChoice = choices[Math.floor(Math.random() * choices.length)];

    let resultText = "";
    let change = 0;

    if (playerChoice === computerChoice) {
        resultText = `It's a draw! You both chose ${playerChoice}`;
    } else if (
        (playerChoice === 'rock' && computerChoice === 'scissors') ||
        (playerChoice === 'paper' && computerChoice === 'rock') ||
        (playerChoice === 'scissors' && computerChoice === 'paper')
    ) {
        change = betInCoins;
        realScore += change;
        addToHistory(`+${(change / DISPLAY_MULTIPLIER).toFixed(8)} CT (Game Win)`);
        showNotification(`You won +${(change / DISPLAY_MULTIPLIER).toFixed(8)} CT`);
        resultText = `You win! 🎉 ${playerChoice} beats ${computerChoice}`;
    } else {
        change = -betInCoins;
        realScore = Math.max(0, realScore + change);
        addToHistory(`-${(-change / DISPLAY_MULTIPLIER).toFixed(8)} CT (Game Lose)`);
        showNotification(`You lost ${(-change / DISPLAY_MULTIPLIER).toFixed(8)} CT`);
        resultText = `You lose 😞 ${computerChoice} beats ${playerChoice}`;
    }

    localStorage.setItem("score", realScore);
    displayScore(realScore);
    document.getElementById("game-result").innerText = resultText;
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

// === Отображение счёта ===
function displayScore(score) {
    document.getElementById("score").innerText = (score / DISPLAY_MULTIPLIER).toFixed(8);
}

// === История ===
let clickHistory = JSON.parse(localStorage.getItem("clickHistory")) || [];

function addToHistory(text) {
    const timestamp = new Date().toLocaleTimeString();
    clickHistory.push(`${timestamp} — ${text}`);

    if (clickHistory.length > 50) {
        clickHistory.shift(); // Лимит истории
    }

    localStorage.setItem("clickHistory", JSON.stringify(clickHistory));
}

// === Вернуться на главную ===
function goBack() {
    window.location.href = "index.html";
}