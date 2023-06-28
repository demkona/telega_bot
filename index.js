const telegramApi = require("node-telegram-bot-api");
require('dotenv').config()
const {gameOptions, againOptions} = require('./options')
const token = process.env.TELEGRAM_BOT_TOKEN;

const bot = new telegramApi(token, { polling: true });

const chats = {};

const startGame = async (chatId) => {
  await bot.sendMessage(
    chatId,
    "Зараз я загадаю число від 0 до 9, а ти спробуй його відгадати"
  );
  const randomNumber = Math.floor(Math.random() * 10);
  chats[chatId] = randomNumber;
  await bot.sendMessage(chatId, "Поїхали!", gameOptions);
};

const start = () => {
  bot.setMyCommands([
    { command: "/start", description: "Ласкаво просимо на гру" },
    { command: "/info", description: "Отримати інформацію про користувача" },
    { command: "/game", description: "Поїхали!" },
  ]);

  bot.on("message", async (msg) => {
    const text = msg.text;
    const chatId = msg.chat.id;

    if (text === "/start") {
      await bot.sendSticker(
        chatId,
        "https://i.pinimg.com/564x/6d/a6/f2/6da6f2f175042ee4f3a5dbeb5f66f356.jpg"
      );
      return bot.sendMessage(chatId, `Ласкаво просимо до нашої гри`);
    }
    if (text === "/info") {
      return bot.sendMessage(chatId, `Тебе звати ${msg.from.first_name}`);
    }
    if (text === "/game") {
      return startGame(chatId);
    }
    return bot.sendMessage(chatId, "Нeвірна команда, спробуйте ще раз!");
  });
};

bot.on("callback_query", (msg) => {
  const data = msg.data;
  const chatId = msg.message.chat.id;
  if (data === "/again") {
    return startGame(chatId);
  }
  if (data == chats[chatId]) {
    return bot.sendMessage(
      chatId,
      `Вітаю ${msg.from.first_name}! Ви відгадали число ${chats[chatId]}`,
      againOptions
    );
  } else {
    return bot.sendMessage(
      chatId,
      `${msg.from.first_name} Нажаль ви не відгадали число ${chats[chatId]}`,
      againOptions
    );
  }
});

start();
