let score = parseInt(localStorage.getItem("score")) || 0;

document.getElementById("score").innerText = score;

function clickButton() {
    score++;
    document.getElementById("score").innerText = score;
    localStorage.setItem("score", score);

    // Анимация увеличения счёта
    const scoreBox = document.querySelector(".score-box");
    scoreBox.style.transform = "scale(1.2)";
    setTimeout(() => {
        scoreBox.style.transform = "scale(1)";
    }, 100);
}

function resetScore() {
    if (confirm("Сбросить счёт? Это удалит все данные!")) {
        score = 0;
        document.getElementById("score").innerText = score;
        localStorage.removeItem("score");
    }
}
