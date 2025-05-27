const express = require('express');
const path = require('path');

const app = express();

// Обслуживаем статические файлы из текущей папки
app.use(express.static(path.join(main, '.')));

// Все маршруты возвращают index.html
app.get('/*', (req, res) => {
    res.sendFile(path.join(main, 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
});
