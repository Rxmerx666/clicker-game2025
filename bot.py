from aiogram import Bot, Dispatcher, types
from aiogram.filters import Command
from aiogram.types import InlineKeyboardButton, WebAppInfo
import asyncio

# 🔐 Замените на ваш токен
API_TOKEN = "7891862499:AAFeksdA3QDdV1hTq0BKc5MNfvUclTPaQbs"

# 🤖 Инициализация бота
bot = Bot(token=API_TOKEN)
dp = Dispatcher()

# 🎮 Команда /play — отправляет кнопку Web App
@dp.message(Command('play'))
async def send_play(message: types.Message):
    url = "https://rxmerx666.github.io/clicker-game2025/ "  # Ссылка на твой сайт

    button = [[InlineKeyboardButton(text="🎮 Играть", web_app=WebAppInfo(url=url))]]
    markup = types.InlineKeyboardMarkup(inline_keyboard=button)

    await message.answer("Играй прямо в Telegram:", reply_markup=markup)

# 🚀 Команда /start
@dp.message(Command('start'))
async def send_welcome(message: types.Message):
    await message.reply("Привет! Напиши /play, чтобы начать играть.")

# 🛠 Основная функция запуска бота
async def main():
    await dp.start_polling(bot)

if __name__ == '__main__':
    asyncio.run(main())