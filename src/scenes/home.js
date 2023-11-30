import {Composer, Markup, Scenes} from "telegraf";

const startScene = new Composer()
startScene.start( async (ctx) => {
    await ctx.reply(`Привет, ${ctx.session.user}! Последний визит ${ctx.session.lastVisit?ctx.session.lastVisit:'не найден'}`,
        Markup.inlineKeyboard([
            Markup.button.callback("Обратная связь", 'feedback')]))
    return ctx.wizard.next()
})

startScene.on(["text","callback_query"], async (ctx) => {
    await ctx.reply(`Привет, ${ctx.session.user}! Последний визит ${ctx.session.lastVisit?ctx.session.lastVisit:'не найден'}`,
        Markup.inlineKeyboard([
            Markup.button.callback("Обратная связь", 'feedback')]))
    return ctx.wizard.next()
})
const secondScene = new Composer()

secondScene.action('feedback', async (ctx) => await ctx.scene.enter('feedbackWizard'))

export const homeScene = new Scenes.WizardScene('homeWizard', startScene, secondScene)
