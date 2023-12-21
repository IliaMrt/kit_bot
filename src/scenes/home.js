import {Composer, Markup, Scenes} from "telegraf";
import {Interface} from "../interface/interface.js";
const sel = new Interface()

const startScene = new Composer()
startScene.start( async (ctx) => {
    await sel.home(ctx)

})

startScene.on(["text","callback_query"], async (ctx) => {
    await sel.home(ctx)

})
const secondScene = new Composer()

secondScene.action('feedback', async (ctx) => await ctx.scene.enter('feedbackWizard'))

export const homeScene = new Scenes.WizardScene('homeWizard', startScene, secondScene)
