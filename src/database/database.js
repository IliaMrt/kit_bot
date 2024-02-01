import {Markup} from "telegraf";
import Axios from "axios";
import axiosRetry from 'axios-retry';
import {isArray} from "util";

class Database {
    instance = null;

    constructor() {
        if (this.instance) { // проверяем что значение #instance не равно null (т.е. уже что-то присвоено), и прерываем инструкцию, чтобы в соответствии с принципом синглтон сохранить значения присвоенные при первой инициации.
            return this.instance;
        }

    }


    async init() {
        await this.getFull()
    }

    async getFull() {
        const r = await Axios.create(
            {baseURL:          `http://localhost:3110/kit`}
        )
        axiosRetry(r, { retries: 10, retryDelay: (retryCount) => {
                return  5000;
            } });
        const q=await r.get('/update')
        full = q.data
        allUsers=new Map(full.users)
        lastVisits=new Map(full.lastVisits)
        classStudents=new Map(full.classStudents)
        lessonClass=new Map(full.lessonClass)
        lessonTeachers=new Map(full.lessonTeachers)
        return
    }

   async _getUserName(nick) {
        const r = await Axios.post(
            `http://localhost:3110/kit/get-user-name`,
            {nick: nick}
        )

        return r.data
    }
   async getUserName(nick) {
        return allUsers.get(nick)
    }

    async getLastVisit(nick) {
        return lastVisits.get(nick)
    }

    async _getLastVisit(nick) {

        const r = await Axios.post(
            `http://localhost:3110/kit/get-last-visit`,
            // `${this.url}/kit/get-user-name`,
            {nick: nick}
        )

        return r.data
    }

    async getLessons(user) {
        const allLesons=new Set()
        Array.from(lessonTeachers.values()).forEach(v=>
            v.forEach(w=>allLesons.add(w[0]))
        )
        return {
            mainLessons:isArray(lessonTeachers.get(await this.getUserName(user)))
                //если у учителя нет своих уроков - возвращаем пустой массив
                ?(lessonTeachers.get(await this.getUserName(user))).map(v=>v[0])
                :[],
            restLessons:Array.from(allLesons)}
    }

    async _getLessons(user) {

        const r = await Axios.post(
            `http://localhost:3110/kit/get-lessons-by-user`,
            {nick: user}
        )

        return r.data
    }

    async getClasses(lesson) {
        return lessonClass.get(lesson)

    }

    async _getClasses(lesson) {

        const r = await Axios.get(
            `http://localhost:3110/kit/get-classes-by-lesson/${lesson}`,
        )

        return r.data
    }

    async getStudents(classs) {
        const res=[]
       classStudents.get(classs).forEach((student) => {
                res.push({
                    id: res.length + 1,
                    student: student,
                    attended: true,
                    hard: true,
                    soft: true,
                });
        });
        return res
    }
async _getStudents(classs) {

        const r = await Axios.get(
            `http://localhost:3110/kit/get-kids-by-classes/${classs}`,
        )

        return r.dareturnta
    }

    async saveFeedback(newData) {
        const r = await Axios.create(
            {baseURL:          `http://localhost:3110/kit`}
        )
        axiosRetry(r, { retries: 20, retryDelay: (retryCount) => {
                return  5000;
            } });
        const q=await r.post('/write-feedback', newData)

        return q.data
        /*
        const r = await Axios.post(
            `http://localhost:3110/kit/write-feedback`,
            newData
        )
        return r.data*/
    }
}

export const database = new Database();
export let doc;

export function fitText(array) {
    return array.reduce((p, c) => p += `\n${c}`, '')
}

export function getButtons(array) {
    const buttons = []
    for (const elem of array) {
        buttons.push([Markup.button.callback(elem, elem)])
    }
    return buttons
}

export function getDateTime(input) {
    const res = input.substr(2, input.length - 4).split(' ')
    const temp = res[0].split('.')
    res[0] = `${temp[2]}.${temp[1]}.${temp[0]}`
    return res
}

export function getDate(input) {
    console.log(input)
    const temp = input.split('_')[1].split('-')
    console.log(temp)
    console.log(`${temp[2]}.${temp[1]}.${temp[0]}`)

    return `${temp[2]}.${temp[1]}.${temp[0]}`
}
export function getCtxData(ctx){
    switch (ctx.updateType){
        case 'callback_query' :   return ctx.update.callback_query.data
        case 'message' :   return ctx.update.message.text
    }
    return undefined
}
export let full;
export let allUsers
export let lastVisits
export let classStudents
export let lessonClass
export let lessonTeachers