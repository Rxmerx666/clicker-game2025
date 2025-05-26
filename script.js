let score = parseInt(localStorage.getItem("score")) || 0;

document.getElementById("score").innerText = score;

function clickButton() {
    score++;
    document.getElementById("score").innerText = score;
    localStorage.setItem("score", score);

    const scoreBox = document.querySelector(".score-box");
    scoreBox.style.transform = "scale(1.2)";
    setTimeout(() => {
        scoreBox.style.transform = "scale(1)";
    }, 100);
}

function resetScore() {
    if (confirm("Reset score? This will delete all progress!")) {
        score = 0;
        document.getElementById("score").innerText = score;
        localStorage.removeItem("score");
    }
}
