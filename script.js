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

// === Фоновая добыча монет при повторном запуске ===
function applyOfflineEarnings() {
    const lastVisit = parseInt(localStorage.getItem("lastVisit"));
    const now = Date.now();

    if (!isNaN(lastVisit)) {
        const secondsOffline = Math.floor((now - lastVisit) / 1000);

        // === Защита от изменения системного времени ===
        const MAX_OFFLINE_SECONDS = 60 * 60 * 24; // Максимум 24 часа
        const MIN_OFFLINE_SECONDS = 0;

        if (secondsOffline < MIN_OFFLINE_SECONDS) {
            console.warn("Время системы изменено: lastVisit больше текущего времени.");
            return;
        }

        if (secondsOffline > MAX_OFFLINE_SECONDS) {
            console.warn(`Слишком большое время офлайна: ${secondsOffline} секунд`);
            realScore += MAX_OFFLINE_SECONDS * 1;
            const formattedEarnings = (MAX_OFFLINE_SECONDS * 1 / DISPLAY_MULTIPLIER).toFixed(8);
            addToHistory(`+${formattedEarnings} CT (Offline | Лимитировано)`);
            showNotification(`You got ${formattedEarnings} C/T out of the game in the last 24 hours`);
        } else {
            realScore += secondsOffline * 1;
            const formattedEarnings = (secondsOffline / DISPLAY_MULTIPLIER).toFixed(8);
            addToHistory(`+${formattedEarnings} C/T (Offline)`);
            showNotification(`You got ${formattedEarnings} C/T for ${formatTime(secondsOffline)} outside the game`);
        }
    }

    localStorage.setItem("lastVisit", Date.now()); // обновляем при входе
    setRealScore(realScore);
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

    // Для демонстрации используем симуляцию
    const simulatedNewReferred = ["ABC123", "XYZ789"];

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

// === Инициализация ===
displayScore(realScore);
document.getElementById("level").innerText = level;
updateProgress(realScore, level);
renderHistory();

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
