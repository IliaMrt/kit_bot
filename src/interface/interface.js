import {database, getButtons} from "../database/database.js";
import {Markup} from "telegraf";

export class Interface {

    async selectLesson(ctx, msg, firstChoise) {

        let buttons = []
        if (firstChoise) {

            let temp = ctx.wizard.state.data.lessons.mainLessons
            if (!temp.length) {
                temp = ['...']
            } else {
                temp.push('...')
            }
            buttons = getButtons(temp)
        } else {

            let temp = [...ctx.wizard.state.data.lessons.mainLessons, ...ctx.wizard.state.data.lessons.restLessons]
            buttons = getButtons(temp)
        }

        await ctx.reply(msg, Markup.inlineKeyboard(buttons))
    }

    async multiSelection(ctx, target, msg) {
        console.log('start multiSelection')
        if (!ctx.wizard.state.data.buttons?.length) {
            const names = ctx.wizard.state.data[target]
            for (const name of names) {
                ctx.wizard.state.data.items.set(name, true)
                ctx.wizard.state.data.buttons.push([Markup.button.callback(`${name}✅`, name.toString())])
            }
            ctx.wizard.state.data.buttons.push([Markup.button.callback('Продолжить', 'next'),
                Markup.button.callback('☠️Прервать', 'home')])
            ctx.reply(msg, Markup.inlineKeyboard(ctx.wizard.state.data.buttons))
        } else {
            // инвертируем флаг предыдущего выбранного сотрудника
            ctx.wizard.state.data.items.set(
                ctx.update.callback_query.data, !ctx.wizard.state.data.items.get(
                    ctx.update.callback_query.data))

            const items = ctx.wizard.state.data.items
            const buttons = []

            for (const item of items) {
                buttons.push([{text: `${item[0]}${item[1] ? '✅' : '➖'}`, callback_data: item[0]}])
            }
            buttons.push([{text: 'Продолжить', callback_data: 'next'},
                Markup.button.callback('☠️Прервать', 'home')])

            await ctx.editMessageReplyMarkup({inline_keyboard: buttons})

        }

    }

    async whenSelector(ctx, msg) {
        ctx.reply(msg, Markup.inlineKeyboard([
            [Markup.button.callback("Сегодня", 'now'),
                Markup.button.callback("Календарь", 'calendar')]]))
        return ctx.wizard.next()

    }

    async getComment(ctx) {
        ctx.reply(`Введите комментарий:`, Markup.inlineKeyboard([Markup.button.callback('Нет комментария', 'no_comments')]))//todo добавить кнопку no_comment
        return ctx.wizard.next()
    }

    async selectClass(ctx, msg) {

        let buttons = []
       //такая хитрая форма, потому что получаем классы с дубликатами. Сразу убираем дубли и сортируем
        ctx.wizard.state.data.classes = Array.from(new Set(await database.getClasses(ctx.wizard.state.data.lesson))).sort()

        buttons = getButtons(ctx.wizard.state.data.classes)

        await ctx.reply(msg, Markup.inlineKeyboard([...buttons, [{text: '☠️Прервать', callback_data: 'home'}]]))
    }

    async start(ctx) {
        ctx.session.user = await database.getUserName(ctx.from.username)
        ctx.session.lastVisit = await database.getLastVisit(ctx.from.username)
        console.log(ctx.session.user)
        if (ctx.session.user) {
            return ctx.scene.enter('homeWizard')
        } else {
            return ctx.reply('Вы не авторизованы')
        }

    }

    async home(ctx) {
        ctx.session.user = await database.getUserName(ctx.from.username)
        ctx.session.lastVisit = await database.getLastVisit(ctx.from.username)
        console.log(ctx.session.user)
        if (!ctx.session.user) {
            return ctx.reply('Вы не авторизованы')
        }
        await ctx.reply(`Привет, ${ctx.session.user}! Последний визит ${ctx.session.lastVisit ? ctx.session.lastVisit : 'не найден'}`,
            Markup.inlineKeyboard([
                Markup.button.callback("Обратная связь", 'feedback'),
                Markup.button.callback("ЛК админа", 'admin', ctx.from.username != "ilmar_ilmar" &&
                    ctx.from.username != "TanchMartens"),]))
        return ctx.wizard.next()
    }
}