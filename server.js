const express = require('express');
const path = require('path');

const app = express();

// Обслуживаем статические файлы из текущей директории
app.use(express.static(path.join(__dirname, '.'));

// Возвращаем index.html для всех маршрутов
app.get('/*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
});