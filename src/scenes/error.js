import {Composer, Markup, Scenes} from "telegraf";

const startScene = new Composer()
startScene.start( async (ctx) => {
    await ctx.reply('Обнаружена ошибка',
        Markup.inlineKeyboard([
            Markup.button.callback("Заново", 'feedback')]))
    return ctx.wizard.next()
})

startScene.on(["text","callback_query"], async (ctx) => {
    await ctx.reply('Обнаружена ошибка',
        Markup.inlineKeyboard([
            Markup.button.callback("Заново", 'feedback')]))
    return ctx.wizard.next()
})
const secondScene = new Composer()

secondScene.action('feedback', async (ctx) => await ctx.scene.enter('feedbackWizard'))

export const errorScene = new Scenes.WizardScene('errorWizard', startScene, secondScene)
