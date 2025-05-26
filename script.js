// Загружаем счёт из localStorage, если он есть, иначе начинаем с 0
let score = parseInt(localStorage.getItem("score")) || 0;

// Обновляем отображение счёта при загрузке страницы
document.getElementById("score").innerText = score;

function clickButton() {
    score++;
    document.getElementById("score").innerText = score;
    
    // Сохраняем обновлённый счёт в localStorage
    localStorage.setItem("score", score);
}
