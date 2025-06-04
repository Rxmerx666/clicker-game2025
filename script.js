// === Настройки ===
const DISPLAY_MULTIPLIER = 1e8; // 1 CT = 100 000 000
const CLICK_VALUE = 1; // +0.00000001 CT
const AUTO_CLICK_VALUE = 10; // +0.00000010 CT/сек
const MAX_CLICKS_PER_SECOND = 10;

// --- Реферальные настройки ---
const REFERRAL_BONUS = 100 * DISPLAY_MULTIPLIER; // +0.00000100 CT за каждого реферала
let referralCode = localStorage.getItem("referralCode") || generateReferralCode();
let referredUsers = JSON.parse(localStorage.getItem("referredUsers")) || [];

let autoClickerEnabled = false;
let autoClickerInterval = null;
let clickCooldown = false;

// Загружаем данные из localStorage
let realScore = parseInt(localStorage.getItem("score")) || 0;
let level = parseInt(localStorage.getItem("level")) || getLevelByScore(realScore);
let clickHistory = JSON.parse(localStorage.getItem("clickHistory")) || [];

(function fixSimulatedReferralBonuses() {
    const SIMULATED_REFERRALS = ["ABC123", "XYZ789"];
    const BONUS_PER_REFERRAL = 10_000_000; // REFERRAL_BONUS
    const storedReferred = JSON.parse(localStorage.getItem("referredUsers")) || [];

    let totalBonusToRemove = 0;

    // Сколько бонусов нужно убрать
    for (let ref of SIMULATED_REFERRALS) {
        if (storedReferred.includes(ref)) {
            totalBonusToRemove += BONUS_PER_REFERRAL;
        }
    }

    if (totalBonusToRemove > 0) {
        let currentScore = parseInt(localStorage.getItem("score")) || 0;
        let newScore = Math.max(0, currentScore - totalBonusToRemove);

        localStorage.setItem("score", newScore);
        localStorage.setItem("referralBonusApplied", "true");

        console.log(`Симуляционные бонусы удалены: ${totalBonusToRemove / DISPLAY_MULTIPLIER} CT`);
        console.log(`Новый баланс: ${newScore / DISPLAY_MULTIPLIER} CT`);
    } else {
        console.log("Симуляционные бонусы не найдены");
    }
})();

// === Фоновая добыча монет при повторном запуске ===
function applyOfflineEarnings() {
    const lastVisit = parseInt(localStorage.getItem("lastVisit"));
    const now = Date.now();

    if (!isNaN(lastVisit)) {
        const secondsOffline = Math.floor((now - lastVisit) / 1000);

        const MAX_OFFLINE_SECONDS = 60 * 60 * 24;
        const MIN_OFFLINE_SECONDS = 0;

        if (secondsOffline < MIN_OFFLINE_SECONDS) {
            console.warn("Время системы изменено.");
            return;
        }

        if (secondsOffline > MAX_OFFLINE_SECONDS) {
            realScore += MAX_OFFLINE_SECONDS * 1;
            const formattedEarnings = (MAX_OFFLINE_SECONDS / DISPLAY_MULTIPLIER).toFixed(8);
            addToHistory(`+${formattedEarnings} CT (Offline | Limit)`);
            showNotification(`You got ${formattedEarnings} C/T in the last 24 hours`);
        } else {
            realScore += secondsOffline * 1;
            const formattedEarnings = (secondsOffline / DISPLAY_MULTIPLIER).toFixed(8);
            addToHistory(`+${formattedEarnings} CT (Offline)`);
            showNotification(`You got ${formattedEarnings} C/T for ${formatTime(secondsOffline)} offline`);
        }
    }

    localStorage.setItem("lastVisit", now);
    setRealScore(realScore);

    // === Обновляем интерфейс после начисления оффлайн-монет ===
    displayScore(realScore);
    updateProgress(realScore, level);
}

// Вызываем при загрузке
applyOfflineEarnings();

// === Реферальная система ===

// Генерация уникального кода
function generateReferralCode(length = 6) {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "";
    for (let i = 0; i < length; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    localStorage.setItem("referralCode", code);
    return code;
}

// Проверка реферала по URL
function handleIncomingReferral() {
    const urlParams = new URLSearchParams(window.location.search);
    const ref = urlParams.get("ref");

    if (ref && ref !== referralCode) {
        if (!localStorage.getItem("referrer")) {
            const existingRefs = JSON.parse(localStorage.getItem("referredUsers")) || [];

            if (!existingRefs.includes(ref)) {
                localStorage.setItem("referrer", ref);
                alert("Вы зарегистрировались по реферальной ссылке!");
                console.log(`Пользователь пришёл по ссылке: ${ref}`);
            }
        }
    }
}

handleIncomingReferral();

// Начисление бонуса за рефералов
function checkAndRewardReferrals() {
    const storedReferred = JSON.parse(localStorage.getItem("referredUsers")) || [];
    const currentReferred = [...storedReferred];

    simulatedNewReferred.forEach(ref => {
        if (!currentReferred.includes(ref)) {
            realScore += REFERRAL_BONUS;
            setRealScore(realScore);
            currentReferred.push(ref);
            addToHistory(`+${(REFERRAL_BONUS / DISPLAY_MULTIPLIER).toFixed(8)} CT (Referral)`);
            showNotification(`You received a bonus for a new referral!`);
        }
    });

    localStorage.setItem("referredUsers", JSON.stringify(currentReferred));
}

checkAndRewardReferrals();

// Копирование реферальной ссылки
function copyReferralLink() {
    const link = `${window.location.origin}${window.location.pathname}?ref=${referralCode}`;
    navigator.clipboard.writeText(link).then(() => {
        showNotification("Referral link copied to clipboard!");
    });
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

// Формат времени: секунды → "X мин Y сек" или "X ч Y мин"
function formatTime(seconds) {
    seconds = Math.floor(seconds);
    if (seconds < 60) return `${seconds} sec`;
    else if (seconds < 3600) return `${Math.floor(seconds / 60)} min ${seconds % 60} sec`;
    else return `${Math.floor(seconds / 3600)} h ${Math.floor((seconds % 3600) / 60)} min`;
}

// === Функции отображения счёта и истории ===
function displayScore(realScore) {
    const displayedScore = (realScore / DISPLAY_MULTIPLIER).toFixed(8);
    document.getElementById("score").innerText = displayedScore;
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

function addToHistory(text) {
    const timestamp = new Date().toLocaleTimeString();
    clickHistory.push(`${timestamp} — ${text}`);

    if (clickHistory.length > 50) {
        clickHistory.shift(); // Ограничиваем до 50 записей
    }

    localStorage.setItem("clickHistory", JSON.stringify(clickHistory));
    renderHistory();
}

// === Формулы уровня и прогресса ===
function getLevelByScore(realScore) {
    const displayedScore = realScore / DISPLAY_MULTIPLIER;

    if (displayedScore < 0.00001) return 1;
    if (displayedScore < 0.00010) return 2;
    if (displayedScore < 0.00100) return 3;
    if (displayedScore < 0.01000) return 4;
    if (displayedScore < 0.10000) return 5;
    if (displayedScore < 1.00000) return 6;

    let level = 6;
    let required = 1.0; // уровень 7 → 1.0
    while (displayedScore >= required) {
        required *= 10;
        level++;
    }

    return level;
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



// === Клик по кнопке "+0.00000001 CT" ===
function clickButton() {
    if (clickCooldown) return;

    realScore += CLICK_VALUE;
    setRealScore(realScore);
    displayScore(realScore);
    addToHistory(`+${(CLICK_VALUE / DISPLAY_MULTIPLIER).toFixed(8)} CT`);
    checkLevelUp(realScore);
    updateProgress(realScore, level);

    clickCooldown = true;
    setTimeout(() => {
        clickCooldown = false;
    }, 100); // 100 мс = максимум 10 кликов в секунду
}

function setRealScore(value) {
    localStorage.setItem("score", value);
    // ❌ Не обновляем lastVisit при каждом клике!
}

// === Проверка повышения уровня ===
function checkLevelUp(realScore) {
    const newLevel = getLevelByScore(realScore);
    if (newLevel > level) {
        level = newLevel;
        document.getElementById("level").innerText = level;
        localStorage.setItem("level", level);

        const levelBox = document.querySelector(".level-box");
        if (levelBox) {
            levelBox.style.transform = "scale(1.1)";
            setTimeout(() => {
                levelBox.style.transform = "scale(1)";
            }, 200);
        }

        updateProgress(realScore, level);
    }
}

// === Автокликер: +0.00000010 CT в секунду ===
function toggleAutoClicker() {
    const button = document.getElementById("auto-clicker-btn");

    if (!autoClickerEnabled) {
        autoClickerInterval = setInterval(() => {
            realScore += AUTO_CLICK_VALUE;
            setRealScore(realScore);
            displayScore(realScore);
            addToHistory(`+${(AUTO_CLICK_VALUE / DISPLAY_MULTIPLIER).toFixed(8)} CT (Auto)`);
            checkLevelUp(realScore);
            updateProgress(realScore, level);
        }, 1000);

        button.innerText = "Disable Auto-Clicker";
        autoClickerEnabled = true;
    } else {
        clearInterval(autoClickerInterval);
        button.innerText = "Enable Auto-Clicker";
        autoClickerEnabled = false;
    }
}

// === Сброс ===
function resetScore() {
    if (confirm("Reset score? This will delete all progress!")) {
        realScore = 0;
        level = getLevelByScore(realScore);
        setRealScore(realScore);
        localStorage.setItem("level", level);
        localStorage.removeItem("clickHistory");

        displayScore(realScore);
        document.getElementById("level").innerText = level;
        updateProgress(realScore, level);

        clickHistory = [];
        renderHistory();
    }
}

// === Переключатель видимости истории ===
function toggleHistory() {
    const historyBox = document.getElementById("history-box");
    const toggleBtn = document.getElementById("history-toggle-btn");

    const isVisible = historyBox.classList.contains("visible");

    if (isVisible) {
        historyBox.classList.remove("visible");
        toggleBtn.innerText = "📜 Show History";
    } else {
        historyBox.classList.add("visible");
        toggleBtn.innerText = "❌ Hide History";

        const historyList = document.getElementById("history-list");
        historyList.scrollTop = historyList.scrollHeight;
    }
}

// === Настройки игры "Камень-Ножницы-Бумага" ===
const GAME_WIN_MULTIPLIER = 1.0; // x1 выигрыш
const GAME_LOSE_PENALTY_MULTIPLIER = 0.5; // x0.5 проигрыш

// === Функция игры "Камень-Ножницы-Бумага" ===
function playGame(playerChoice) {
    const input = document.getElementById("betAmount");
    const betValue = parseFloat(input.value);

    if (isNaN(betValue) || betValue <= 0) {
        alert("Введите корректную сумму ставки!");
        return;
    }

    const betInCoins = Math.floor(betValue * DISPLAY_MULTIPLIER); // Конвертируем в "сырые" монеты

    if (betInCoins < 1) {
        alert("Минимальная ставка: 0.00000001 CT");
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

    // Обработка результатов
    if (playerChoice === computerChoice) {
        resultText = `It's a draw! 🤝 You both chose ${playerChoice}`;
    } else if (
        (playerChoice === 'rock' && computerChoice === 'scissors') ||
        (playerChoice === 'paper' && computerChoice === 'rock') ||
        (playerChoice === 'scissors' && computerChoice === 'paper')
    ) {
        change = Math.floor(betInCoins * GAME_WIN_MULTIPLIER);
        realScore += change;
        addToHistory(`+${(change / DISPLAY_MULTIPLIER).toFixed(8)} CT (Game Win)`);
        showNotification(`You won +${(change / DISPLAY_MULTIPLIER).toFixed(8)} CT`);
        resultText = `You win! 🎉 ${playerChoice} beats ${computerChoice}`;
    } else {
        change = -Math.floor(betInCoins * GAME_LOSE_PENALTY_MULTIPLIER);
        realScore = Math.max(0, realScore + change);
        addToHistory(`-${(-change / DISPLAY_MULTIPLIER).toFixed(8)} CT (Game Lose)`);
        showNotification(`You lost ${(-change / DISPLAY_MULTIPLIER).toFixed(8)} CT`);
        resultText = `You lose 😞 ${computerChoice} beats ${playerChoice}`;
    }

    // Сохраняем изменения
    setRealScore(realScore);
    displayScore(realScore);
    updateProgress(realScore, level);
    document.getElementById("game-result").innerText = resultText;

    // Очищаем поле ввода
    input.value = "";
}
