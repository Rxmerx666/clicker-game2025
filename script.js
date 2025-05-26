// Загружаем счёт из localStorage или начинаем с 0
let score = parseInt(localStorage.getItem("score")) || 0;

// Обновляем счёт на странице при загрузке
document.getElementById("score").innerText = score;

function clickButton() {
    score++;
    document.getElementById("score").innerText = score;
    localStorage.setItem("score", score); // Сохраняем в localStorage
    console.log("Сохранённый счёт:", localStorage.getItem("score"));
}

function resetScore() {
    score = 0;
    document.getElementById("score").innerText = score;
    localStorage.removeItem("score"); // Удаляем сохранённый счёт
    console.log("Счёт сброшен");
}
