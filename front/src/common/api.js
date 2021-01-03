import axios from "axios"
import dietMake from "../utils/dietMake"
import {eventsMake} from "../utils/eventsMake"
import {timestampHyphen} from '../utils/timestamp'
import htmlDecode from '../utils/htmlDecode'

async function asyncForEach(array, callback) {
    for (let index = 0; index < array.length; index++) {
        await callback(array[index], index, array);
    }
}

const getDietByDate = async (date) => {
    let key = "diet/" + date
    let item = sessionStorage.getItem(key)
    if (item != null) {
        return JSON.parse(item)
    }

    const resp = await axios.get("diets/" + date)
    let diets = []
    await asyncForEach(resp.data, d => {
        diets.push(dietMake(d))
    })
    sessionStorage.setItem(key, JSON.stringify(diets))
    return diets
}

const getD2UByDiet = async (id) => {
    let userID = localStorage.getItem("me.id")
    let key = `d2u/${userID}/${id}`

    let item = sessionStorage.getItem(key)
    if (item != null) {
        return item
    }

    let applied = "0"
    try {
        const {data} = await axios.get(`users/${userID}/diet2user/${id}`)
        if (data.Applied) {
            applied = "1"
        }
    } catch (e) {
        applied = "2"
    }
    if (applied !== "2") {
        sessionStorage.setItem(key, applied)
    }

    return applied
}

const getEvents = async (year, month) => {
    let key = `events-month/${year}/${month}`
    let item = sessionStorage.getItem(key)
    let data = {}
    if (item != null) {
        data = JSON.parse(item)
    } else {
        const resp = await axios.get(`events/${year}/${month}`)
        data = resp.data
        sessionStorage.setItem(key, JSON.stringify(data))
    }

    return await eventsMake(data)
}

const getEventsByDate = async date => {
    let key = `events-date/${date}`
    let item = sessionStorage.getItem(key)
    if (item != null) {
        return JSON.parse(item)
    }

    const {data} = await axios.get(`events/${date}`)
    if (data === null) {
        sessionStorage.setItem(key, JSON.stringify([]))
        return []
    }
    sessionStorage.setItem(key, JSON.stringify(data))
    return data
}

const getEventsDateOnly = async () => {
    let key = `events-date-only/${timestampHyphen(new Date())}`
    let item = sessionStorage.getItem(key)
    if (item != null) {
        return JSON.parse(item)
    }

    const {data} = await axios.get(`events/date-only`)
    sessionStorage.setItem(key, JSON.stringify(data))
    return data
}

const getDietReviewPossible = async id => {
    let userID = localStorage.getItem("me.id")
    let key = `diet-reviews/${userID}/${id}`

    let item = sessionStorage.getItem(key)
    if (item != null) {
        return JSON.parse(item)
    }

    let {data} = await axios.get(`diet-reviews/${id}`)
    let dietList = htmlDecode(data.Content).replace(/(\d?\d\.){1,}/g, "").split("\n")

    sessionStorage.setItem(key, JSON.stringify(dietList))
    return dietList
}

const getTimetable = async (meGrade, meClass) => {
    let key = `timetables/${meGrade}-${meClass}/20210101`
    let item = localStorage.getItem(key)
    if (item != null) {
        return JSON.parse(item)
    }

    const {data} = await axios.get(`timetables/${meGrade}/${meClass}`)
    localStorage.setItem(key, JSON.stringify(data.Lessons))
    return data.Lessons
}

export {getDietByDate, getD2UByDiet, getEvents, getEventsByDate, getEventsDateOnly, getDietReviewPossible, getTimetable}
