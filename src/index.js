import {Telegraf, session, Scenes} from "telegraf";
import {database} from "./database/database.js";
import {homeScene} from "./scenes/home.js";
import {Calendar} from "telegram-inline-calendar";
import {open} from "fs/promises";
import process from "process";
import {feedbackScene} from "./scenes/feedback/feedback.js";
import {errorScene} from "./scenes/error.js";
import {Interface} from "./interface/interface.js";
import {adminScene} from "./scenes/admin/admin.js";


await readSettings();
await database.init()
export const bot = new Telegraf(process.env.TELEGRAF_TOKEN);
const stage = new Scenes.Stage(
    [homeScene, feedbackScene, errorScene, adminScene])
export const calendar = new Calendar(bot, {
    date_format: 'DD-MM-YYYY',
    language: 'ru',
    start_week_day: 1,
    bot_api: 'telegraf',
    time_selector_mod: false,
    time_range: "00:00-23:59",
    time_step: "15m",
    custom_start_msg: 'Дата и время начала:'
});
bot.use(session())

bot.use(stage.middleware())
const sel = new Interface()
bot.start(async ctx => {
    await sel.start(ctx)
})

bot.on(["text", "callback_query"], async ctx => {
    await sel.start(ctx)
})

bot.launch()
console.log(`Bot started at ${new Date().toLocaleString()}`)

async function readSettings() {
    console.log(process.argv[2])
    const file = await open(`./src/config.files/main.config.json`, 'r');
    let temp = (await file.read()).buffer.toString();
    temp = temp.slice(0, (await file.stat()).size);
    await file.close();
    const data = JSON.parse(temp);
    process.env.URL = data.url;
    process.env.GOOGLE_PRIVATE_KEY = data.private_key;
    process.env.TELEGRAF_TOKEN = process.argv[2]=='prod'?data.telegraf_token:data.telegraf_token_dev;
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL = data.client_email;

}