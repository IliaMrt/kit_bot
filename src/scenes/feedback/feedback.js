import {Composer, Markup, Scenes} from "telegraf";
import {database, fitText, getCtxData, getDate, lastVisits} from "../../database/database.js";
import {Interface} from "../../interface/interface.js";
import {calendar} from "../../index.js";


const sel = new Interface()

const lessonSelection = new Composer()

lessonSelection.on('callback_query', async (ctx) => {
    if (!ctx.wizard.state.hasOwnProperty('data')) {
        ctx.wizard.state.data = {}
        ctx.wizard.state.data.lessons = await database.getLessons(ctx.from.username)
        console.log(JSON.stringify(ctx.wizard.state.data))
    }
    if (ctx.update.callback_query.data == 'feedback') {
        ctx.wizard.state.data = {}
        ctx.wizard.state.data.lessons = await database.getLessons(ctx.from.username)

    }

    const cB = ctx.update.callback_query.data
    if (ctx.wizard.state?.data?.hasOwnProperty('lessons')) {
        console.log(JSON.stringify(ctx.wizard.data?.lessons))
        if (/*ctx.update.callback_query.data != 'feedback' && ctx.update.callback_query.data != '...' &&*/
            ((ctx.wizard.state.data.lessons.mainLessons.find(v => v === cB) ||
                ctx.wizard.state.data.lessons?.restLessons.find(v => v === cB))) && cB != '...') {
            ctx.wizard.next();
            return ctx.wizard.steps[ctx.wizard.cursor].handler(ctx);
        }
    }

    await sel.selectLesson(ctx, 'Выбери урок', ctx.update.callback_query.data == 'feedback')
})


const classSelection = new Composer()

classSelection.on('callback_query', async (ctx) => {
    if (ctx.update?.callback_query?.data == 'home') {
        return await ctx.scene.enter('homeWizard')
    }
    if (!ctx.wizard.state.data.hasOwnProperty('lesson')) {
        ctx.wizard.state.data.lesson = ctx.update.callback_query.data
        await sel.selectClass(ctx, 'Выбери класс')
    } else if (ctx.wizard.state.data.classes.find(v => v === ctx.update?.callback_query?.data)) {
        ctx.wizard.next();
        return ctx.wizard.steps[ctx.wizard.cursor].handler(ctx);
    }
})

const whenSelectorScene = new Composer()
whenSelectorScene.on("callback_query", async (ctx) => {
    ctx.wizard.state.data.class = ctx.update.callback_query.data
    await sel.whenSelector(ctx, 'Урок был сегодня?')

})


const calendarScene = new Composer()
calendarScene.on('callback_query', async (ctx) => {

    if (ctx.update?.callback_query?.data == 'now') {
        ctx.wizard.state.data.date = new Date().toLocaleDateString(
            'ru-Ru',
            {},
        )
        console.log(ctx.wizard.state.data.date)
        ctx.wizard.next();
        return ctx.wizard.steps[ctx.wizard.cursor].handler(ctx);
    }

    if (ctx.update?.callback_query?.data == 'calendar') {
        calendar.startNavCalendar(ctx)
    }

    if (ctx.callbackQuery.message.message_id == calendar.chats.get(ctx.callbackQuery.message.chat.id)) {
        const res = calendar.clickButtonCalendar(ctx);
        if (res !== -1) {
            ctx.wizard.state.data.date = getDate(ctx.callbackQuery.data)
            ctx.wizard.next();
            return ctx.wizard.steps[ctx.wizard.cursor].handler(ctx);
        }

    }
})

const homeTaskScene = new Composer()

homeTaskScene.on("callback_query", (ctx) => {
    if (ctx.update.callback_query.data == 'cancel') {
        ctx.wizard.state.data.homework = ''
        ctx.wizard.next();
        return ctx.wizard.steps[ctx.wizard.cursor].handler(ctx)
    }
    ctx.reply(`Выбрана дата: ${ctx.wizard.state.data.date}\nДомашнее задание:`,
        Markup.inlineKeyboard([Markup.button.callback('Нет домашки', 'cancel')]))
    return ctx.wizard.next()

})

const themeScene = new Composer()
themeScene.on(["text", "callback_query"], async (ctx) => {
    console.log(JSON.stringify(ctx.update))
    if (ctx.update.hasOwnProperty("callback_query")) {
        ctx.wizard.state.data.homework = ''
    } else {
        ctx.wizard.state.data.homework = ctx.update.message.text
    }
    ctx.reply('Какая была тема урока?',
        Markup.inlineKeyboard([Markup.button.callback('Без темы', 'cancel')]))

    return ctx.wizard.next();

})

const whoWasScene = new Composer()
whoWasScene.action('home', ctx => {
    return ctx.scene.enter('homeWizard')
})

whoWasScene.action('next', async (ctx) => {
    const items = ctx.wizard.state.data.items
    const res = []
    for (const item of items) {
        if (item[1]) {
            res.push(item[0])
        }
    }

    if (res.length) {
        ctx.wizard.state.data.students = res
        console.log(res)
        ctx.wizard.state.data.fullStudents.forEach((v) => {
            if (!res.find(r => v.student == r)) {
                v.attended = false
                v.hard = false
                v.soft = false
            }
        })
        ctx.wizard.state.data.buttons = []
        ctx.wizard.next();
        return ctx.wizard.steps[ctx.wizard.cursor].handler(ctx);
    }
})
whoWasScene.on(['callback_query', 'text'], async (ctx) => {
    console.log('who was')
    let firstLaunch = false
    if (!ctx.wizard.state.data.hasOwnProperty('theme')) {
        ctx.wizard.state.data.theme = ctx.updateType == 'message' ? ctx.update.message.text : ''
        firstLaunch = true
        console.log(ctx.wizard.state.data.theme)
    }

    if (!ctx.wizard.state?.data?.hasOwnProperty('fullStudents')) {
        if (!ctx.wizard.state.data.hasOwnProperty('class')) return ctx.scene.enter('errorWizard')
        ctx.wizard.state.data.fullStudents = await database.getStudents(ctx.wizard.state.data.class)
        ctx.wizard.state.data.studentNames = []
        ctx.wizard.state.data.fullStudents.forEach((s) => ctx.wizard.state.data.studentNames.push(s.student))
        ctx.wizard.state.data.items = new Map();
        ctx.wizard.state.data.buttons = [];
    }
    if ((ctx.updateType == 'message' && firstLaunch) || ctx.updateType == "callback_query")
        await sel.multiSelection(ctx, 'studentNames', 'Кто присутствовал?')
})


const megaScene = new Composer()
megaScene.action('home', ctx => {
    return ctx.scene.enter('homeWizard')
})

megaScene.action('nnext', async (ctx) => {
    console.log('nnext')
    ctx.wizard.state.data.fullStudents.forEach((v) => {
        const studentValues = ctx.wizard.state.data.items.get(v.student)
        if (ctx.wizard.state.data.items.get(v.student)) {
            v.commentary = studentValues[2]
            v.hard = studentValues[0]
            v.soft = studentValues[1]
        } else {
            v.commentary = false
        }
    })
    ctx.wizard.next();
    return ctx.wizard.steps[ctx.wizard.cursor].handler(ctx);
})

megaScene.on('callback_query', async (ctx) => {
    console.log((ctx.update.callback_query.data))
    if (ctx.update.callback_query.data == 'next') {
        ctx.wizard.state.data.items = new Map();
        ctx.wizard.state.data.buttons = [];
    }
    if (!ctx.wizard.state.data.buttons?.length) {
        const names = ctx.wizard.state.data.students
        ctx.wizard.state.data.buttons.push(
            [Markup.button.callback(`Имя`, 'skip'),
                Markup.button.callback(`учёба`, 'skip'),
                Markup.button.callback(`включённ.`, 'skip'),
                Markup.button.callback(`коммент.`, 'skip')
            ])
        for (const name of names) {
            ctx.wizard.state.data.items.set(name, [true, true, true])
            ctx.wizard.state.data.buttons.push(
                [Markup.button.callback(`${name}`, 'skip'),
                    Markup.button.callback(`✅`, name.toString() + 0),
                    Markup.button.callback(`✅`, name.toString() + 1),
                    Markup.button.callback(`✅`, name.toString() + 2)
                ])
        }
        ctx.wizard.state.data.buttons.push([Markup.button.callback('Продолжить', 'nnext'),
            Markup.button.callback('☠️Прервать', 'home')])
        return await ctx.reply('Заполняем', Markup.inlineKeyboard(ctx.wizard.state.data.buttons))
    } else if (ctx.update.callback_query.data != 'skip') {
        // инвертируем флаг предыдущего выбранного студента
        const currStudent = ctx.update.callback_query.data.slice(0, ctx.update.callback_query.data.length - 1)
        const pressed = ctx.update.callback_query.data[ctx.update.callback_query.data.length - 1]
        const studentConditions = ctx.wizard.state.data.items.get(currStudent)
        studentConditions[pressed] = !studentConditions[pressed]
        ctx.wizard.state.data.items.set(
            currStudent, studentConditions)

        const items = ctx.wizard.state.data.items
        const buttons = []
        buttons.push(
            [Markup.button.callback(`Имя`, 'skip'),
                Markup.button.callback(`учёба`, 'skip'),
                Markup.button.callback(`включённ.`, 'skip'),
                Markup.button.callback(`коммент.`, 'skip')
            ])
        for (const item of items) {
            console.log(item[1])
            buttons.push([{text: item[0].toString(), callback_data: 'skip'},
                {text: `${item[1][0] ? '✅' : '➖'}`, callback_data: item[0] + '0'},
                {text: `${item[1][1] ? '✅' : '➖'}`, callback_data: item[0] + '1'},
                {text: `${item[1][2] ? '✅' : '➖'}`, callback_data: item[0] + '2'}
            ])
        }
        buttons.push([{text: 'Продолжить', callback_data: 'nnext'},
            Markup.button.callback('☠️Прервать', 'home')])
        await ctx.editMessageReplyMarkup({inline_keyboard: buttons})

    }
})


const commentScene = new Composer()

commentScene.action('nnext', ctx => {
    console.log('catch nnext')
    ctx.wizard.state.data.studentsForComments = []
    ctx.wizard.state.data.fullStudents.forEach(v => {
        if (v.commentary) ctx.wizard.state.data.studentsForComments.push(v.student)
    })
    console.log(ctx.wizard.state.data.studentsForComments)

    if (!ctx.wizard.state.data.studentsForComments.length) {
        ctx.wizard.next();
        return ctx.wizard.steps[ctx.wizard.cursor].handler(ctx);
    }

    return ctx.reply(`Комментарий по ${ctx.wizard.state.data.studentsForComments[ctx.wizard.state.data.studentsForComments.length - 1]}`,
        Markup.inlineKeyboard([Markup.button.callback('Нет комментария', 'no_comment')]))


})

commentScene.on(['text', 'callback_query'], ctx => {
    //todo такое ощущение, что следующие два иф можно удалить
    // if (ctx.update.hasOwnProperty('callback_query')&&ctx.update?.callback_query.data!='nnext')return
    const comment = getCtxData(ctx)
    if (ctx.update.hasOwnProperty('callback_query') && comment != 'no_comment') {
        console.log(JSON.stringify(ctx.update.callback_query))
        ctx.wizard.next();
        return ctx.wizard.steps[ctx.wizard.cursor].handler(ctx);
    }
    const currStudent = ctx.wizard.state.data.studentsForComments.pop()
    const position = ctx.wizard.state.data.fullStudents.findIndex(v => v.student == currStudent)
    ctx.wizard.state.data.fullStudents[position].commentary = comment == 'no_comment' ? '' : comment
    if (!ctx.wizard.state.data.studentsForComments.length) {
        console.log(JSON.stringify(ctx.wizard.state.data.fullStudents))
        ctx.wizard.next();
        return ctx.wizard.steps[ctx.wizard.cursor].handler(ctx);
    }
    ctx.reply(`Комментарий по ${ctx.wizard.state.data.studentsForComments[ctx.wizard.state.data.studentsForComments.length - 1]}`,
        Markup.inlineKeyboard([Markup.button.callback('Нет комментария', 'no_comment')]))

})

const checkScene = new Composer()
checkScene.on(['text', 'callback_query'], async (ctx) => {
    const students = ctx.wizard.state.data.fullStudents.map(v => `${v.student}, ${v.attended ? '+' : '-'}${v.hard ? '+' : '-'}${v.soft ? '+' : '-'} ${v.commentary
        ? v.commentary.slice(0, 100) + (v.commentary.length > 100 ? '<...>' : '')

        : ''}`)
    ctx.reply(`Проверка:\n
    Урок: ${ctx.wizard.state.data.lesson}
    Класс: ${ctx.wizard.state.data.class}
    Когда: ${ctx.wizard.state.data.date}
    ДЗ: ${ctx.wizard.state.data.homework}
    Тема: ${ctx.wizard.state.data.theme}
    ${fitText(students)}
    
    Всё верно?`, Markup.inlineKeyboard(
        [Markup.button.callback('Сохранить', 'save'),
            Markup.button.callback(`Ввести заново`, 'feedback')]))
    return ctx.wizard.next()
})

const thanksScene = new Composer()
thanksScene.on('callback_query', async (ctx) => {
    if (ctx.update.callback_query.data == 'feedback') {
        return await ctx.scene.enter('feedbackWizard')

    }
    if (ctx.update.callback_query.data == 'home') {
        return await ctx.scene.enter('homeWizard')
    }
    const data = ctx.wizard.state.data
    const newData = {
        form: {
            teacher: ctx.session.user,
            mainLessons: data.lesson,
            restLessons: data.lesson,
            class: data.class,
            date: data.date,
            theme: data.theme,
            homework: data.homework
        },
        personalFeedbacks: []
    }
    data.fullStudents.forEach((s) => {
        newData.personalFeedbacks.push({
            student: s.student,
            attended: s.attended,
            hard: s.hard,
            soft: s.soft,
            commentary: s.commentary
        })
    })
    console.log(JSON.stringify(newData))
    await database.saveFeedback(newData)
    //локально обновляем время последнего сохранения
    lastVisits.set(ctx.session.user, `${new Date().toLocaleDateString(
        'ru-Ru',
        {},
    )} в ${new Date().toLocaleTimeString('ru-RU', {
        timeZone: 'Europe/Moscow',
    })}`)
    ctx.session.lastVisit = lastVisits.get(ctx.session.user)
    ctx.reply(`Записано`, Markup.inlineKeyboard(
        [Markup.button.callback('Домой', `home`), Markup.button.callback('Ещё', `feedback`)]))

})


export const feedbackScene = new Scenes.WizardScene('feedbackWizard',
    lessonSelection, classSelection, whenSelectorScene,
    calendarScene, homeTaskScene, themeScene, whoWasScene,
    megaScene, commentScene, checkScene, thanksScene)
