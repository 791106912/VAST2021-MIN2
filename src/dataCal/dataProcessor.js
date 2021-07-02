import { csv } from "d3-fetch"
import { chain } from "lodash"
import moment from "moment"
import { building_coordinate } from "../data/buliding_coordinate"
import { ccLoyMap } from "../data/consumer_data"
import { add } from "../utils"


function calDistance(pointA, pointB) {
    return Math.sqrt(Math.pow(pointA[0] - pointB[0], 2) + Math.pow(pointA[1] - pointB[1], 2))
}

function calMidLine(data) {
    return data.map((d, i) => {
        if(i === data.length - 1) return d
        return {
            ...d,
            long: add(d.long, data[i+1].long) / 2,
            lat: add(d.lat, data[i+1].lat) / 2,
        }
    })
}

// 计算停留点
export function calStopArr(projection) {
    const disGap = 2
    const timeGap = 300
    csv('./data/gps.csv').then(res => {
        console.time()
        const carGeo = chain(res)
        // .filter(d => d.id === '28')
        .map(d => ({
            ...d,
            realTime: moment(d.Timestamp).unix()
        }))
        .reduce((obj, d) => {
            const {id} = d
            const data = obj[id] ? obj[id].data : []
            data.push(d)
            obj[id] = {
                id,
                data,
            }
            return obj
        }, {})
        .values()
        .forEach(d => {
            let thisendtime = 0
            console.log(d.id)
            if(d.id === '28') {
                // let starttime = 0
                // const newData = d.data.map((arr, d) => {
                //     d.long = add(d.long, 0.004)
                //     d.lat = d.lat - 0.0037
                //     const thisTime = moment(d.Timestamp).unix()
                //     if(thisTime - starttime > 10) {
                //         arr.push(d)
                //         starttime = thisTime
                //     }
                //     return arr
                // }, [])
                let newData = d.data
                let i = 0 
                while (i < 10) {
                    newData = calMidLine(newData)
                    i += 1
                }
                newData.forEach(d1 => {
                    d1.long = add(d1.long, 0.004)
                    d1.lat = d1.lat - 0.0037
                })
                d.data = newData
            }
            const stopArr = chain(d.data)
                .map((d1, i) => {
                    if (i === d.data.length - 1) return false
                    if (d1.realTime < thisendtime) return false
                    const data1 = d.data.slice(i, d.data.length)
                    let afterData = []
                    for(let i = 0;i<data1.length; i++) {
                        if (data1[i].realTime >= d1.realTime + timeGap) {
                            afterData = data1.slice(i, data1.length)
                            break
                        }
                    }
                    if(afterData.length > 0) {
                        let endData = null
                        let distance = 0
                        const length = afterData.length
                        const dis1 = calDistance(
                            projection([d1.long, d1.lat]), 
                            projection([afterData[0].long, afterData[0].lat])
                        )
                        //  五分钟没有移动位置 开始停车了。
                        if (dis1 < disGap) {
                            // 接下来计算停车时长
                            for(let i = 0; i<length; i++) {
                                distance = calDistance(
                                    projection([d1.long, d1.lat]), 
                                    projection([afterData[i].long, afterData[i].lat])
                                )
                                // 停车结束
                                if (distance > disGap) {
                                    endData = afterData[i]
                                    thisendtime = endData.realTime
                                    break
                                }
                            }
                            if (endData) {
                                const gap = endData.realTime - d1.realTime
                                return {
                                    gap,
                                    id: d1.id,
                                    long: d1.long,
                                    lat: d1.lat,
                                    st: d1.Timestamp,
                                    et: endData.Timestamp,
                                    dis: distance,
                                }
                            }
                        }
                    }
                    return false
                })
                .filter(d => d && d.gap > 300)
                .value()
            d.stopArr = stopArr
        })
        .value()
        console.log(carGeo)
        console.log(JSON.stringify(carGeo))
        console.timeEnd()
    })
}


// 计算cc和loy的映射
function calCCAndLoyMap(loydata, ccdata) {
        const a = chain(loydata)
            .reduce((obj, d) => {
                const { timestamp, location, price, loyaltynum } = d
                const newData = ccdata.filter(d1 => {
                    const timestampCC = d1.timestamp.split(' ')[0]
                    const priceCC = d1.price
                    const locationCC = d1.location
                    return locationCC === location && priceCC === price && timestamp === timestampCC
                })
                const finalData = obj[loyaltynum] ? obj[loyaltynum].ccdata.concat(newData) : newData;
                const ccGroup = chain(finalData).map('last4ccnum').uniq().value()
                const loydataArr = obj[loyaltynum] ? obj[loyaltynum].loydata : []
                loydataArr.push(d)
                obj[loyaltynum] = {
                loynum: loyaltynum,
                ccdata: finalData,
                loydata: loydataArr,
                ccGroup,
                }
                return obj
            }, {})
            .values()
            .value()

            console.log(a)
}

// 合并CC和loyData
export function mergeCCandLoy() {
    const cc  = new Promise(resolve => {
        csv('./data/cc_data.csv').then(res => {
            resolve(res)
        })
    })
    const loy = new Promise(resolve => {
        csv('./data/loyalty_data.csv').then(res => {
            resolve(res)
        })
    })
    Promise.all([cc, loy]).then(res => {
        const [ccdata, loydata] = res
        chain(loydata)
            .map('loyaltynum')
            .uniq()
            .each(loyaltynum => {
                const thisCCDataId = Array.isArray(ccLoyMap[loyaltynum]) ? ccLoyMap[loyaltynum] : [ccLoyMap[loyaltynum]]
                const thisCCData = ccdata.filter(ccItem => thisCCDataId.includes(ccItem.last4ccnum))
                const thisLoyData = loydata.filter(loyItem => loyItem.loyaltynum === loyaltynum)
                // 三种数据: 
                // 1、正好匹配的 right
                // 2、没刷信用卡的，用现金 cash
                // 3、没刷会员卡的，只用银行卡 cc
                thisLoyData.forEach(loyItem => {
                    const key1 = `${loyItem.timestamp}-${loyItem.location}-${loyItem.price}`
                    let index = 0
                    const crash = thisCCData.filter((ccItem, i) => {
                        const key2 = `${ccItem.timestamp.split(' ')[0]}-${ccItem.location}-${ccItem.price}`
                        if (key2 === key1) index = i
                        return key2 === key1
                    })
                    if (crash.length === 1) {
                        // 情况一
                        loyItem.timestamp = crash[0].timestamp
                        loyItem.type = 'right'
                        thisCCData.splice(index, 1)
                    } else if (crash.length === 0) {
                        // 情况二
                        loyItem.timestamp = `${loyItem.timestamp} 00:00`
                        loyItem.type = 'cash'
                    }
                })
                // 情况三，将其他的全部补充进去！
                thisCCData.forEach(d => {
                    loydata.push({
                        loyaltynum,
                        location: d.location,
                        timestamp: d.timestamp,
                        price: d.price,
                        type: 'justCC',
                    })
                })
            })
            .value()

        console.log(JSON.stringify(loydata))
    })
}

export function calculateCarAndMap(trackData, ccres) {
    const obj = {}
    trackData.forEach(d => {
        const { stopArr } = d
        const timeWithLocation = chain(stopArr)
            .map(d1 => {
                let location = building_coordinate.find(d2 => (
                    Number(d1.long) > d2.range[0][0]
                    &&  Number(d1.long) < d2.range[1][0]
                    &&  Number(d1.lat) < d2.range[0][1]
                    &&  Number(d1.lat) > d2.range[1][1]
                ))
                location = location ? location.name : false
                return {
                    st: moment(d1.st).unix(),
                    et: moment(d1.et).unix(),
                    location,
                }
            })
            .uniq()
            .value()

        const locationRange = timeWithLocation.map(d => d.location)
        const ccdata = chain(ccres)
            .filter(c => {
                const thistime = moment(c.timestamp).unix()
                const find = timeWithLocation.find(t => thistime >= t.st && thistime <= t.et)
                if (!find) return false
                return find.location === c.location
            })
            .reduce((obj, d) => {
                const data = obj[d.loyaltynum] ? obj[d.loyaltynum].data:[]
                data.push(d)
                const location = chain(data).map('location').countBy().value()
                obj[d.loyaltynum] = {
                    location,
                    data,
                    id: d.loyaltynum,
                    count: data.length,
                }
                return obj
            }, {})
            .values()
            .orderBy('count', 'desc')
            .slice(0,5)
            .value()
        obj[d.id] = ccdata
    })
    console.log(obj)
}