import {Markup} from "telegraf";
import Axios from "axios";

class Database {
    instance = null;
    url=''


    constructor() {
        if (this.instance) { // проверяем что значение #instance не равно null (т.е. уже что-то присвоено), и прерываем инструкцию, чтобы в соответствии с принципом синглтон сохранить значения присвоенные при первой инициации.
            return this.instance;
        }
    }


    async init() {

    }

    async getUserName(nick) {


        const r=await Axios.post(
            `http://localhost:3100/kit/get-user-name`,
            {nick:nick}
        )

        return r.data
    }

    async getLastVisit(nick) {

        const r=await Axios.post(
            `http://localhost:3100/kit/get-last-visit`,
            // `${this.url}/kit/get-user-name`,
            {nick:nick}
        )

        return r.data
    }

    async getLessons(user) {

        const r=await Axios.post(
            `http://localhost:3100/kit/get-lessons-by-user`,
            {nick:user}
        )

        return r.data
    }

    async getClasses(lesson) {

        const r=await Axios.get(
            `http://localhost:3100/kit/get-classes-by-lesson/${lesson}`,
        )

        return r.data
    }

    async getStudents(classs) {

        const r=await Axios.get(
            `http://localhost:3100/kit/get-kids-by-classes/${classs}`,
        )

        return r.data
    }

    async saveFeedback(newData) {
        const r=await Axios.post(
            `http://localhost:3100/kit/write-feedback`,
            newData
        )
        return r.data
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
    return `${temp[2]}.${temp[1]}.${temp[0]}`
}