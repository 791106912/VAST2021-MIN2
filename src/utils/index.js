import { ascending } from "d3-array"
import { scaleOrdinal } from "d3-scale"
import { schemeCategory10 } from "d3-scale-chromatic"
import moment from "moment"
import { building_coordinate } from "../data/buliding_coordinate"
import { storeClassify, storeMapType } from "../data/consumer_data"

export  function pushOrPop(arr, d, mode='single') {
    const newArr = [...arr]
    if (mode !== 'single') {
        if (newArr.includes(d)) {
            return newArr.filter(d1 => d1 !== d)
        }
        newArr.push(d)
        return newArr
    } else {
        if (newArr.includes(d)) {
            return []
        } else {
            return [d]
        }
    }
}

//增加两个容易溢出的数据
export function add(a, b) {
    return parseFloat((Number(a) + Number(b)).toFixed(10))
}

// 计算只有时分秒的时间戳
export function calHourTime(hour) {
    let hourStr = hour.toString()
    const count = hourStr.match(/:/g)
        ? hourStr.match(/:/g).length
        : 0
    switch (count) {
        case 0:
            hourStr = `${hourStr}:00:00`
            break;
        case 1:
            hourStr = `${hourStr}:00`
            break;
        default:
            break;
    }
    return moment(`2020-01-01 ${hourStr}`).unix()
}

// 计算商店分类颜色
export const calcualteTypeColor = id => {
    const domain = storeClassify.map(d => d.type)
    const colorScale = scaleOrdinal(domain.sort(ascending), schemeCategory10)
    if (domain.includes(id)) {
        return colorScale(id)
    }
    return 'gray'
}

export const calcualteStoreColor = store => {
    if(store.includes('unknow')) return 'red';
    const type = storeMapType[store] || 'location'
    return calcualteTypeColor(type)
}

export const findLocaiton = (coor) => {
    const [long, lat] = coor
    const a = building_coordinate.find(d => {
        const [sp, ep] = d.range
        return sp[0] < Number(long)
            && Number(long) < ep[0]
            && Number(lat) < sp[1]
            && Number(lat) > ep[1]
    })
    return a ? a.name : false
} 