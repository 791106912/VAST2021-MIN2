import { json } from 'd3-fetch'
import { chain, countBy, forIn, sumBy, } from 'lodash'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import moment from 'moment'
import { axisBottom, axisTop, curveStep, extent, line, schemeCategory10, scaleLinear, scaleOrdinal, scaleTime, scaleBand, select } from 'd3'
import { building_coordinate } from '../../data/buliding_coordinate'
import { calcualteStoreColor, findLocaiton } from '../../utils'


function findHour(timestamp) {
    const hour = parseInt(timestamp.split(' ')[1].split(':')[0])
    return hour
}

const timeRange = [
    {
        name: 'Sleeping.Morning',
        key: 'sm',
        range: [0, 6],
    },
    {
        name: 'Breakfast',
        key: 'bf',
        range: [6, 9],
    },
    {
        name: 'Working.AM',
        key: 'wa',
        range: [9, 12],
    },
    {
        name: 'Lunch',
        key: 'l',
        range: [12, 15],
    },
    {
        name: 'Working.PM',
        key: 'wp',
        range: [15, 18],
    },
    {
        name: 'Dinner',
        key: 'd',
        range: [18, 20],
    },
    {
        name: 'After Dinner',
        key: 'ad',
        range: [20, 22],
    },
    {
        name: 'Sleeping.Night',
        key: 'sn',
        range: [22, 24],
    },
]
function calcualteTimeRange(hour) {
    return timeRange.find(d => d.range[0] <= hour && d.range[1] > hour).key
}

export default function CarTrack() {
    const svgRef = useRef(null)

    const [width, height] = [1000,600]
    const [top, right, bottom, left] = [40, 20, 20, 60]
    const graphHeight = height - top - bottom
    const graphWidth = width - left - right

    const timeScale = scaleTime(
        [new Date('2020-01-01 00:00:00'), new Date('2020-01-01 23:59:59')]
    , [0, graphWidth])

    const timeScaleObj = useMemo(() => {
        return timeRange.reduce((obj, d) => {
            obj[d.key] = {
                ...d,
                data: [],
                scale: scaleOrdinal([0,1], [1,10]),
            }
            return obj
        }, {})
    }, [])

    const [stopArr, setstopArr] = useState([])

    const stopLocation = useMemo(() => {
        const useData = chain(stopArr)
        .map('data')
        .flatten()
        .reduce((obj, d) => {
            const key = `${d.range}-${d.location}`
            const dataArr = obj[key] ? obj[key].data : []
            dataArr.push(d)
            const [st, et] = extent(
                chain(dataArr)
                    .map('st')
                    .map(d1 => new Date(`2020-01-01 ${d1.split(' ')[1]}`).getTime())
                    .value()
            ).map(d1 => moment(d1).format('MM/DD/YYYY HH:mm:ss'))
            obj[key] = {
                key,
                data: dataArr,
                range: d.range,
                st,
                et,
                location: d.location,
                count: dataArr.length,
            }
            return obj
        }, {})
        .values()
        .value()
        return useData
    }, [stopArr])

    const calCarColor = useMemo(() => {
        return scaleOrdinal(stopArr.map(d => d.id), schemeCategory10)
    }, [stopArr])

    const carTrack = useMemo(() => {
        const useData = chain(stopArr)
            .map('data')
            .flatten()
            .reduce((obj, d) => {
                const dataArr = obj[d.id] ? obj[d.id].data : []
                dataArr.push(d)
                obj[d.id] = {
                    id: d.id,
                    data: dataArr,
                }
                return obj
            }, {})
            .values()
            .map(car => {
                const { data, id } = car
                const trackArr = chain(data)
                    .reduce((obj, d) => {
                        const key = d.day
                        if(!obj[key])obj[key] = []
                        obj[key].push(d)
                        return obj
                    }, {})
                    .values()
                    .reduce((obj, d) => {
                        d.forEach((stopItem, i) => {
                            if (i === 0) return
                            const source = d[i-1].location
                            const sourceRange = d[i-1].range
                            const target = stopItem.location
                            const targetRange = stopItem.range
                            const key = `${source}-${sourceRange}-${target}-${targetRange}`
                            obj[key] = {
                                key,
                                source,
                                target,
                                sourceRange,
                                targetRange,
                                count: obj[key] ? obj[key].count + 1 : 1,
                            }
                        })
                        return obj
                    }, {})
                    .values()
                    .value()
                return {
                    id,
                    track: trackArr,
                }
            })
            .value()

        console.log(useData)
        return useData
    }, [stopArr])

    const pathWidthScale = useMemo(() => {
        const domain = extent(chain(carTrack).map('track').flatten().map('count').value())
        return scaleLinear(domain, [1,5])
    }, [carTrack])
    const heightScale = useMemo(() => scaleLinear(), [])

    function drawParall(gps) {
        // 每辆车 每天的停留事件
        let unknowCount = 0
        const useStopArr = chain(gps)
            .filter(d => ['1','2', '3'].includes(d.id))
            .map('stopArr')
            .flatten()
            // .filter(d => d.st.split(' ')[0] === '01/06/2014')
            .reduce((obj, d) => {
                const {id, st, long, lat} = d
                const [day, time] = st.split(' ')
                const hour = findHour(st)
                const key = `${id}-${day}`
                let location = findLocaiton([long, lat]) 
                if (!location) {
                    const item = {
                        name: `unknow_${unknowCount}`,
                        desc: '',
                        range: [[Number(long) - 0.001, Number(lat) + 0.001], [Number(long) + 0.001, Number(lat) - 0.001]],
                        type: 'unknow',
                    }
                    building_coordinate.push(item)
                    location = findLocaiton([long, lat])
                    unknowCount += 1
                }
                const range = calcualteTimeRange(hour)

                const dataItem = {
                    ...d,
                    location,
                    hour,
                    day,
                    time,
                    range,
                }

                timeScaleObj[range].data.push(dataItem)

                const dataArr = obj[key] ? obj[key].data : []
                dataArr.push(dataItem)
                obj[key] = {
                    data: dataArr,
                    id: id,
                    day: day,
                }
                return obj
            }, {})
            .values()
            .value()

        const maxValue = chain(useStopArr)
            .map('data')
            .flatten()
            .countBy('range')
            .values()
            .maxBy()
            .value()
            
        heightScale.domain([0, maxValue])
            .range([4, graphHeight/ 2])

        forIn(timeScaleObj, (val, key) => {
            const countObj = countBy(val.data.map(d => d.location))
            const countData = chain(countObj)
                .entries()
                .map(d => ({
                    name: d[0],
                    value: d[1],
                }))
                .orderBy('value', 'desc')
                .value()

            const sum = sumBy(countData, 'value')
            const domain = []
            const gap = 20
            const totalSpace = heightScale(sum) + (countData.length - 1) * gap
            const topItem = (graphHeight - totalSpace) / 2
            const range = countData.map((d, i) => {
                domain.push(d.name)
                const valuePrv = sumBy(countData.slice(0, i), 'value')
                return topItem + heightScale(sum) * valuePrv / sum + i * gap
            })
            timeScaleObj[key].scale = scaleOrdinal(domain, range)
            domain.forEach(store => {
                const value = countObj[store]
                const idArr = chain(val.data)
                    .filter(d1 => d1.location === store)
                    .map('id')
                    .uniq()
                    .sortBy()
                    .value()
                timeScaleObj[key][`${store}Scale`] = scaleLinear([1, value], [0, heightScale(value)])
                // console.log(idArr)
                timeScaleObj[key][`${store}CarIdScale`] = scaleBand(idArr, [0, heightScale(value)])
            })
        })
        
        setstopArr(useStopArr)
        select('.timeAxisBottom').call(axisBottom().scale(timeScale))
        select('.timeAxisTop').call(axisTop().scale(timeScale))
    }


    useEffect(() => {
        json('./data/gpswithstop.json').then(gps => {
            console.log(gps)
            drawParall(gps)
        })
    }, [])

    
    const obj = {}

    const createLine = line()
        // .curve(curveBasis)
        .curve(curveStep)

    return (
        <div>
            <svg ref={svgRef} height={height} width={width} style={{
                background: '#e9e9e9'
            }}>
                <g className="bg" transform={`translate(${left}, ${top})`}>
                    <g className='timeAxisTop' transform={`translate(${0}, ${0})`}/>
                    <g className='timeAxisBottom' transform={`translate(${0}, ${height - top - bottom})`}/>
                    <g>
                        {[6, 12, 14, 18, 20, 22].map(d => {
                            const x = timeScale(new Date(`2020-01-01 ${d}:00:00`))
                            const lineAttr = {
                                key: d,
                                x1: x,
                                x2: x,
                                y1: 0,
                                y2: graphHeight,
                            }
                            return (
                                <line {...lineAttr} />
                            )
                        })}
                    </g>
                    <g className='stop'>
                        {
                            stopArr.map(d => {
                                const { data, id, day } = d
                                const carColor = calCarColor(id)
                                return (
                                    <g className='dayItem' key={`${id}-${day}`}>
                                        {
                                            data.map(d1 => {
                                                const {st, et, location, range } = d1
                                                const x1 = timeScale(new Date(`2020-01-01 ${st.split(' ')[1]}`))
                                                // const x1 = timeScale(new Date(`2020-01-01 ${hour}:00:00`))
                                                let x2 = timeScale(new Date(`2020-01-01 ${et.split(' ')[1]}`))
                                                if(x2 < x1) x2 = timeScale(new Date(`2020-01-01 23:59:59`))
                                                const { scale } = timeScaleObj[range]
                                                let y = scale(location)
                                                const storeKey = `${range}-${location}`
                                                if(!obj[storeKey]) {
                                                    obj[storeKey] = 1
                                                } else {
                                                    obj[storeKey] = obj[storeKey] + 1
                                                }
                                                if(timeScaleObj[range][`${location}Scale`]) {
                                                    y += timeScaleObj[range][`${location}Scale`](obj[storeKey])
                                                    // y += timeScaleObj[range][`${location}Scale`](d1.id)
                                                }
                                                const lineAttr = {
                                                    key: `${location}-${et}-${st}`,
                                                    x1: x1,
                                                    y1: y,
                                                    x2: x2,
                                                    y2: y,
                                                    stroke: carColor,
                                                    onMouseEnter: () => {
                                                        console.log(d1)
                                                    }
                                                }
                                                const circleAttr = {
                                                    key: `${location}-${et}-${st}`,
                                                    cx: x1,
                                                    cy: y,
                                                    stroke: carColor,
                                                    fill: carColor,
                                                    fillOpacity: .4,
                                                    r: 0,
                                                    onMouseEnter: () => {
                                                        console.log(d1)
                                                    }
                                                }
                                                return (
                                                    <circle {...circleAttr} />
                                                )
                                            })
                                        }
                                    </g>
                                )
                            })
                        }
                    </g>
                    <g className="car">
                        {carTrack.map((d, i) => {
                                const { id, track } = d
                                const carColor = calCarColor(id)
                                return (
                                    <g className='trackItem' key={`${id}-track`}>
                                        {
                                            track.map(d1 => {
                                                const { source, sourceRange, target, targetRange } = d1
                                                const { scale: sourceScale } = timeScaleObj[sourceRange]
                                                let sourceY = sourceScale(source)
                                                const { scale: targetScale } = timeScaleObj[targetRange]
                                                if (timeScaleObj[sourceRange][`${source}CarIdScale`]) {
                                                    sourceY += timeScaleObj[sourceRange][`${source}CarIdScale`](id)
                                                    sourceY += timeScaleObj[sourceRange][`${source}CarIdScale`].bandwidth() / 2
                                                }
                                                let targetY = targetScale(target)
                                                if (timeScaleObj[targetRange][`${target}CarIdScale`]) {
                                                    targetY += timeScaleObj[targetRange][`${target}CarIdScale`](id)
                                                    targetY += timeScaleObj[targetRange][`${target}CarIdScale`].bandwidth() / 2
                                                }

                                                const sourStop = stopLocation.find(
                                                    d2=> d2.location === source && d2.range === sourceRange
                                                )
                                                let sourceX = timeScale(
                                                    new Date(`2020-01-01 ${sourStop.et.split(' ')[1]}`)
                                                )
                                                let targetX = timeScale(
                                                    new Date(`2020-01-01 ${stopLocation.find(
                                                        d2=> d2.location === target && d2.range === targetRange
                                                    ).st.split(' ')[1]}`)
                                                )

                                                if(sourStop.st === sourStop.et) {
                                                    sourceX = sourceX + 10
                                                }

                                                const pathArr = [
                                                    [sourceX, sourceY],
                                                    [targetX, targetY]
                                                ]

                                                const pathAttr = {
                                                    fill: 'none',
                                                    stroke: carColor,
                                                    strokeWidth: pathWidthScale(d1.count),
                                                    strokeOpacity: pathWidthScale(d1.count) / 5,
                                                }
                                                return (
                                                    <g key={d1.key} stroke={carColor}>
                                                        <path d={createLine(pathArr)} {...pathAttr} />
                                                        <line {...{
                                                            x1: pathArr[0][0],
                                                            y1: pathArr[0][1] - 3,
                                                            x2: pathArr[0][0],
                                                            y2: pathArr[0][1] + 3,
                                                            strokeWidth: 2,
                                                        }} />
                                                        <path d={
                                                            line()([
                                                                [
                                                                    pathArr[1][0] - 2,
                                                                    pathArr[1][1] - 2
                                                                ],
                                                                [
                                                                    pathArr[1][0] + 2,
                                                                    pathArr[1][1]
                                                                ],
                                                                [
                                                                    pathArr[1][0] - 2,
                                                                    pathArr[1][1] + 2
                                                                ],
                                                                [
                                                                    pathArr[1][0] - 2,
                                                                    pathArr[1][1] - 2
                                                                ],
                                                            ])
                                                        }
                                                        fill='#fff'
                                                        />
                                                        {/* {pathArr.map(d2 => {
                                                            const [cx, cy] = d2
                                                            const circleAttr = {
                                                                key: `${d1.key}-${cx}`,
                                                                stroke: carColor,
                                                                cx,
                                                                cy,
                                                                r: 3,
                                                                fill: '#fff'
                                                            }
                                                            return <circle {...circleAttr} />
                                                        })} */}
                                                    </g>
                                                )
                                            })
                                        }
                                    </g>
                                )
                            })}
                    </g>
                    <g>
                        {stopLocation.map(d => {
                            const { st,et, range, location, key, count } = d
                            const { scale } = timeScaleObj[range]
                            const sx = timeScale(new Date(`2020-01-01 ${st.split(' ')[1]}`))
                            let ex = timeScale(new Date(`2020-01-01 ${et.split(' ')[1]}`))
                            if(ex < sx) ex = timeScale(new Date(`2020-01-01 23:59:59`))
                            const y = scale(location)
                            const rectheight = heightScale(count)
                            const color = calcualteStoreColor(location)
                            const rectAttr = {
                                x: 0,
                                y: 0,
                                width: ex - sx || 10,
                                height: rectheight,
                                fill: color,
                                // stroke: color,
                                fillOpacity: .2,
                            }
                            const gAttr = {
                                key,
                                transform: `translate(${sx}, ${y})`,
                                fontSize: 9,
                                onMouseEnter: () => {console.log(d)}
                            }
                            return (
                                <g {...gAttr}>
                                    <rect {...rectAttr} />
                                    <text dx={rectAttr.width / 2}
                                    style={{
                                        textAnchor: 'middle',
                                        fontSize: 6,
                                    }}>{d.location}</text>
                                </g>
                            )
                        })}
                    </g>
                </g>
            </svg>
        </div>
    )
}
