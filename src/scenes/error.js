import {Composer, Markup, Scenes} from "telegraf";
import {error_bot} from "../index.js";
import {Interface} from "../interface/interface.js";
import {database} from "../database/database.js";
import process from "process";
const sel = new Interface()

const startScene = new Composer()
startScene.start( async (ctx) => {
    await ctx.reply('Обнаружена ошибка сервера',
        Markup.inlineKeyboard([
            Markup.button.callback("Сообщить администратору", 'reportToAdmin')]))
    return ctx.wizard.next()
})

startScene.on(["text","callback_query"], async (ctx) => {
    await ctx.reply('Обнаружена ошибка сервера',
        Markup.inlineKeyboard([
            Markup.button.callback("Сообщить администратору", 'reportToAdmin'),
            Markup.button.callback("Попробовать ещё раз", 'home')
        ]))
    return ctx.wizard.next()
})
const secondScene = new Composer()

secondScene.action('reportToAdmin', async (ctx) => {
    console.log('send message')
    error_bot.telegram.sendMessage(547424591, `${new Date().toLocaleString()} Пользователь ID: ${ctx.from.id}, userName: ${ctx.from.username}, сообщает: Ошибка сервера ${process.env.SERVER_NAME}`)
    await ctx.reply('Спасибо, сообщение администратору отправлено. Попробуйте зайти в бот чуть позже',
        Markup.inlineKeyboard([
            Markup.button.callback("Попробовать зайти снова", 'home')]))
})

secondScene.action('home',async (ctx) => {
    await database.getFull()
    await sel.start(ctx)
})

export const errorScene = new Scenes.WizardScene('errorWizard', startScene, secondScene)
