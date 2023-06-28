const telegramApi = require("node-telegram-bot-api");
require("dotenv").config();
const sequelize = require("./db");
const { gameOptions, againOptions } = require("./options");
const UserModel = require("./models");
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

const start = async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync();
  } catch (e) {
    console.log("Немає підключення до бд (ERROR)", e);
  }

  bot.setMyCommands([
    { command: "/start", description: "Ласкаво просимо на гру" },
    { command: "/info", description: "Отримати інформацію про користувача" },
    { command: "/game", description: "Поїхали!" },
  ]);

  bot.on("message", async (msg) => {
    const text = msg.text;
    const chatId = msg.chat.id;

    try {
      if (text === "/start") {
        await UserModel.create({ chatId });
        await bot.sendSticker(
          chatId,
          "https://tlgrm.ru/_/stickers/ea5/382/ea53826d-c192-376a-b766-e5abc535f1c9/7.webp"
        );
        return bot.sendMessage(chatId, `Ласкаво просимо до нашої гри`);
      }
      if (text === "/info") {
        const user = await UserModel.findOne({ chatId });
        return bot.sendMessage(
          chatId,
          `Тебе звати ${msg.from.first_name}, ти вгадав ${user.right}, не вгадав ${user.wrong}`
        );
      }
      if (text === "/game") {
        return startGame(chatId);
      }
      return bot.sendMessage(chatId, "Нeвірна команда, спробуйте ще раз!");
    } catch (e) {
      return bot.sendMessage(chatId, "Невідома помалка.");
    }
  });
};

bot.on("callback_query", async (msg) => {
  const data = msg.data;
  const chatId = msg.message.chat.id;
  if (data === "/again") {
    return startGame(chatId);
  }
  const user = await UserModel.findOne({ chatId });
  console.log("ЦЕ МОЯ ТЕМА", typeof(data), data, typeof(chats[chatId]), chats[chatId] )
  if (data == chats[chatId]) {
    user.right += 1;
    await bot.sendMessage(
      chatId,
      `Вітаю ${msg.from.first_name}! Ви відгадали число ${chats[chatId]}`,
      againOptions
    );
  } else {
    user.wrong += 1;
    await bot.sendMessage(
      chatId,
      `${msg.from.first_name} Нажаль ви не відгадали число ${chats[chatId]}`,
      againOptions
    );
    await user.save();
  }
});

start();
