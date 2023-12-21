import {Composer, Markup, Scenes} from "telegraf";
import {database} from "../../database/database.js";
const firstScene=new Composer()
firstScene.action('admin',ctx=>{
    console.log(1)
   return ctx.reply('Вы можете обновить БД', Markup.inlineKeyboard([ Markup.button.callback("Обновить", 'reload'),
       Markup.button.callback("Домой", 'home')]))

})
firstScene.action('reload',async ctx => {
    await database.getFull()
    console.log('ok')
    ctx.wizard.next();
    return ctx.wizard.steps[ctx.wizard.cursor].handler(ctx);
})
firstScene.action('home',async ctx => {
    return await ctx.scene.enter('homeWizard')
})

const finScene=new Composer()
finScene.action('reload',ctx=>{
    console.log(ctx.update.callback_query.data)
    ctx.reply(`Данные обновлены`, Markup.inlineKeyboard(
        [Markup.button.callback('Домой', `goHome`)]))
})
finScene.action('goHome',async ctx => {
    return await ctx.scene.enter('homeWizard')
})


export const adminScene = new Scenes.WizardScene('adminWizard',firstScene,finScene)
