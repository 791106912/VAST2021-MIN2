import { json } from 'd3-fetch'
import { chain, countBy, forIn, sumBy, } from 'lodash'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import moment from 'moment'
import { axisBottom, axisTop, curveStep, extent, line, schemeCategory10, scaleLinear, scaleOrdinal, scaleTime, scaleBand, select, schemePaired, easeLinear } from 'd3'
import { building_coordinate } from '../../data/buliding_coordinate'
import { calcualteStoreColor, findLocaiton, pushOrPop } from '../../utils'
import { dayStr } from '../../data/consumer_data'
import './index.scss'


function findHour(timestamp) {
    const hour = parseInt(timestamp.split(' ')[1].split(':')[0])
    return hour
}

const timeRange = [
    {
        name: 'Sleep.Morning',
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
        name: 'Sleep.Night',
        key: 'sn',
        range: [22, 24],
    },
]
function calcualteTimeRange(hour) {
    return timeRange.find(d => d.range[0] <= hour && d.range[1] > hour).key
}
const [width, height] = [1140,700]
const [top, right, bottom, left] = [40, 20, 20, 300]
const graphHeight = height - top - bottom
const graphWidth = width - left - right

const createLine = line()
    // .curve(curveBasis)
    .curve(curveStep)

export default function CarTrack() {
    //!=============================== 图背景相关 ===============================
    // ============== 画坐标轴 ==============
    const timeScale = useMemo(() => {
        return scaleTime(
            [new Date('2020-01-01 00:00:00'), new Date('2020-01-01 23:59:59')]
        , [0, graphWidth])
    }, [])

    useEffect(() => {
        const tickValues = timeRange.map(d => new Date(`2020-01-01 ${d.range[0]}:00:00`))
        const tickFormat = d => moment(d).format('HH:mm')
        select('.timeAxisBottom').call(axisBottom().tickValues(tickValues).tickFormat(tickFormat).scale(timeScale))
        select('.timeAxisTop').call(axisTop().tickValues(tickValues).tickFormat(tickFormat).scale(timeScale))
    }, [timeScale])

    //! =============================== 左侧图数据相关 ===============================

    // ============== 监听原始数据，程序的开始 ==============
    const [originData, setoriginData] = useState([])

    useEffect(() => {
        json('./data/gpswithstop.json').then(gps => {
            let unknowCount = 0
            gps.forEach(d => {
                const newStopArr = d.stopArr.map(d1 => {
                    const { long, lat } = d1
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
                    const locationInfo = building_coordinate.find(d2 => d2.name === location)
                    return {
                        ...d1,
                        location,
                        locationInfo,
                    }
                })
                d.stopArr = newStopArr
            })
            console.log(gps)
            setoriginData(gps)
        })
    }, [])

    // ============== 根据原始数据获取所有的汽车的ID ==============
    const carid = useMemo(() => {
        return originData.map(d => d.id)
    }, [originData])

    // ============== 汽车ID的Y比例尺 ==============
    const carIdScale = useMemo(() => {
        return scaleBand(carid, [0, graphHeight])
    }, [carid])
    // ============== 汽车颜色计算 ==============
    const calCarColor = useMemo(() => {
        return scaleOrdinal(carid, schemePaired)
    }, [carid])
    
    // ============== 汽车的选中 ==============
    const [activeCarId, setactiveCarId] = useState(['1'])

    // ============== 定义日期的y轴比例尺 ==============
    const dayStrScale = useMemo(() => {
        return scaleBand(dayStr, [0, graphHeight]).paddingInner(.1)
    }, [])

    // ============== 日期的选中 ==============
    const [activetime, setactivetime] = useState(dayStr)

    // ============== 地点的选中 ==============
    const [disabledLocation, setDisabledLocation] = useState([])

    // ============== 右侧图所用的展示数据 ==============
    const [useData, setuseData] = useState([])

    // ============== 根据汽车和日期的选中，算出右侧图数据 ==============
    useEffect(() => {
        const useData =  originData
            .filter(d => activeCarId.includes(d.id))
            .map(d => ({
                id: d.id,
                stopArr: d.stopArr
                .filter(
                    d1 => activetime.includes(d1.st.split(' ')[0])
                )
            }))
        setuseData(useData)
    }, [originData, activeCarId, activetime])

    //! =============================== 右侧图数据相关 ===============================
    // ============== 计算每个停留点高度的scale ==============
    const heightScale = useMemo(() => scaleLinear(), [])

    // ============== 商店legend的数据 ==============
    const [stopLegend, setstopLegend] = useState([])

    // ============== 查看商店细节的 ==============
    const [detailLocation, setdetailLocation] = useState([])

    // ============== 计算每个车每天的在不同的停留点 ==============
    const carStopArr = useMemo(() => {
        let useStopArr = chain(useData)
            .map('stopArr')
            .flatten()
            .map(d => {
                const {st} = d
                const [time] = st.split(' ')
                const hour = findHour(st)
                const timeRange = calcualteTimeRange(hour)
                return {
                    ...d,
                    hour,
                    time,
                    range: timeRange,
                }
            })
            .value()

        const newStopLegend = chain(useStopArr)
            .map(d => d.locationInfo.classify)
            .uniq()
            .map(d => {
                const data = chain(useStopArr)
                    .filter(d1 => d1.locationInfo.classify === d)
                    .map('location')
                    .uniq()
                    .value()
                return {
                    classify: d,
                    data,
                }
            })
            .value()
        setstopLegend(newStopLegend)

        // useStopArr = useStopArr.filter(d => !disabledLocation.includes(d.location))

        const maxValue = chain(useStopArr)
            .map('data')
            .flatten()
            .countBy('range')
            .values()
            .maxBy()
            .value()
            
        heightScale.domain([0, maxValue])
            .range([4, graphHeight/ 2])
        return useStopArr
    }, [heightScale, useData])

    // ============== 定义每一个Range的比例尺 ==============
    const timeScaleObj = useMemo(() => {
        return timeRange.reduce((obj, d) => {
            const data = carStopArr.filter(d1 => d1.range === d.key)
            const countObj = countBy(data.map(d1 => d1.location))
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
            const range = countData.map((d1, i) => {
                domain.push(d1.name)
                const valuePrv = sumBy(countData.slice(0, i), 'value')
                return topItem + heightScale(sum) * valuePrv / sum + i * gap
            })
            obj[d.key] = {
                ...d,
                data,
                scale: scaleOrdinal(domain, range), //地点在y上的比例尺
            }
            domain.forEach(store => {
                const value = countObj[store]
                const idArr = chain(data)
                    .filter(d1 => d1.location === store)
                    .map('id')
                    .uniq()
                    .sortBy()
                    .value()
                // 汽车停留点在地点内部的位置偏移比例尺
                obj[d.key][`${store}Scale`] = scaleLinear([1, value], [0, heightScale(value)])
                // 汽车箭头的比例尺
                obj[d.key][`${store}CarIdScale`] = scaleBand(idArr, [0, heightScale(value)])
            })
            return obj
        }, {})
    }, [carStopArr, heightScale])

    // ============== 商店的位置，也是根据停留点得到的 ==============
    const stopLocation = useMemo(() => {
        const useData = chain(carStopArr)
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
                locationInfo: d.locationInfo,
                count: dataArr.length,
            }
            return obj
        }, {})
        .values()
        .value()
        return useData
    }, [carStopArr])

    // ============== 汽车的连线，也是根据停留点得到的 ==============
    const carTrack = useMemo(() => {
        const useData = chain(carStopArr)
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
        return useData
    }, [carStopArr])

    // ============== 汽车连线宽度的比例尺 ==============
    const pathWidthScale = useMemo(() => {
        const domain = extent(chain(carTrack).map('track').flatten().map('count').value())
        return scaleLinear(domain, [1,5])
    }, [carTrack])

    //! =============================== tooltip相关 ===============================
    const [tooltips, settooltips] = useState({
        style: {
            display: 'none',
        },
        content: {
            name: '',
        },
    })

    const closeTips = () => settooltips({
        style: {
            display: 'none',
        },
        content: {
            name: '',
        },
    })

    //! =============================== 其他 ===============================
    const obj = {}

    return (
        <div className='carTrackGraph'>
            <svg height={height} width={width}>
                <g className="bg-left" transform={`translate(${100}, ${top})`}>
                    <g className='car'>
                        {carid.map(d => {
                            const gAttr = {
                                key: d,
                                transform: `translate(${0}, ${carIdScale(d) + carIdScale.bandwidth()/ 2})`,
                                className: `carItem ${activeCarId.includes(d) ? 'active' : 'disabled'}`,
                                onClick: () => {
                                    const newCarId = pushOrPop(activeCarId, d, 'mulity')
                                    setactiveCarId(newCarId)
                                }
                            }
                            const color = calCarColor(d)
                            const circleAttr = {
                                cx: 0,
                                cy: 0,
                                stroke: color,
                                fill: color,
                            }
                            const textAttr = {
                                dx: 6,
                                dy: 3,
                            }
                            return (
                                <g {...gAttr}>
                                    <circle {...circleAttr}/>
                                    <text {...textAttr}>{d}</text>
                                </g>
                            )
                        })}
                    </g>
                    <g className='day' transform={`translate(100, 0)`}>
                        {dayStr.map(d => {
                            const y = dayStrScale(d)
                            const spaceItem = dayStrScale.bandwidth()
                            const gAttr = {
                                key: d,
                                transform: `translate(${0}, ${y + spaceItem / 2})`,
                                className: `dayItem ${activetime.includes(d) ? 'active' : 'disabled'}`,
                                onClick: () => {
                                    const newActiveTime = pushOrPop(activetime, d, 'mulity')
                                    setactivetime(newActiveTime)
                                }
                            }
                            const rectAttr = {
                                x: 0,
                                y: -spaceItem / 2,
                                height: spaceItem,
                            }
                            const textAttr = {
                                dx: 14,
                            }
                            const day = d.split('/')[1]
                            return (
                                <g {...gAttr}>
                                    <rect {...rectAttr}/>
                                    <text {...textAttr}>{`${day} ${['11', '12', '17', '18'].includes(day) ? 'weekend' : ''}`}</text>
                                </g>
                            )
                        })}
                    </g>
                </g>
                <g className="bg-right" transform={`translate(${left}, ${top})`}>
                <g className='transform-g'>
                    {/* 选择图 */}
                    {/* 主图 */}
                    <g className='timeAxisTop' transform={`translate(${0}, ${0})`}/>
                    <g className='timeAxisBottom' transform={`translate(${0}, ${height - top - bottom})`}/>
                    <g className='timeRange'>
                        {timeRange.map(d => {
                            const x0 = timeScale(new Date(`2020-01-01 ${d.range[0]}:00:00`))
                            const x1 = timeScale(new Date(`2020-01-01 ${d.range[1]}:00:00`))
                            const xhalf = (x1 - x0) / 2
                            const lineAttr = {
                                x1: 0,
                                x2: 0,
                                y1: 0,
                                y2: graphHeight,
                                stroke: '#d9d9d9',
                                strokeDasharray: 10,
                            }
                            const gAttr = {
                                transform: `translate(${x0}, 0)`,
                                key: d.name,
                            }
                            const textAttr = {
                                dx: xhalf,
                                textAnchor: 'middle',
                                dy: -10,
                                fontSize: 8,
                                fill: '#000',
                            }
                            return (
                                <g {...gAttr}>
                                    <line {...lineAttr} />
                                    <text {...textAttr}>{d.name}</text>
                                </g>
                            )
                        })}
                    </g>
                    {/* 车的连线图 连线和箭头 */}
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
                                                sourceY += timeScaleObj[sourceRange][`${source}CarIdScale`](id)
                                                sourceY += timeScaleObj[sourceRange][`${source}CarIdScale`].bandwidth() / 2

                                                let targetY = targetScale(target)
                                                targetY += timeScaleObj[targetRange][`${target}CarIdScale`](id)
                                                targetY += timeScaleObj[targetRange][`${target}CarIdScale`].bandwidth() / 2

                                                const sourStop = stopLocation.find(
                                                    d2=> d2.location === source && d2.range === sourceRange
                                                )
                                                let sourceX = timeScale(
                                                    new Date(`2020-01-01 ${sourStop.et.split(' ')[1]}`)
                                                )

                                                const targetStop = stopLocation.find(
                                                    d2=> d2.location === target && d2.range === targetRange
                                                )
                                                let targetX = timeScale(
                                                    new Date(`2020-01-01 ${targetStop.st.split(' ')[1]}`)
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
                                                const opacity = disabledLocation.includes(targetStop.location)
                                                || disabledLocation.includes(sourStop.location)
                                                ? 0.1 : 1
                                                const gAttr = {
                                                    opacity,
                                                    key: d1.key,
                                                    stroke: carColor,
                                                }
                                                return (
                                                    <g {...gAttr}>
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
                                                    </g>
                                                )
                                            })
                                        }
                                    </g>
                                )
                            })}
                    </g>
                    {/* 商店图 矩形表示 */}
                    <g className="stopLocation">
                        {stopLocation.map(d => {
                            const { st,et, range, location, key, count, data } = d
                            const { scale } = timeScaleObj[range]
                            const sx = timeScale(new Date(`2020-01-01 ${st.split(' ')[1]}`))
                            let ex = timeScale(new Date(`2020-01-01 ${et.split(' ')[1]}`))
                            if(ex < sx) ex = timeScale(new Date(`2020-01-01 23:59:59`))
                            const y = scale(location)
                            const rectheight = heightScale(count)
                            const color = calcualteStoreColor(location)
                            const rectWidth = ex - sx || 10
                            const rectAttr = {
                                x: 0,
                                y: 0,
                                width: rectWidth,
                                height: rectheight,
                                fill: color,
                            }
                            const opacity = disabledLocation.includes(location) ? 0.01 : 1
                            const className= `stopLocationItem-${range}-${location.replace(/['\s]/g, '')}`
                            const gAttr = {
                                key,
                                fontSize: 9,
                                opacity,
                                className: `stopLocationItem ${className} ${detailLocation.includes(key) ? 'active' : '' }`,
                                'transform-origin': `${sx} ${y}`,
                                onMouseEnter: () => {
                                    const relateCar = chain(data).map('id').countBy().entries().map(d1 => d1.join(':')).join('/n').value()
                                    const obj = {
                                        name: location,
                                        'vis count': count,
                                        'relate car': relateCar,
                                    }
                                    settooltips({
                                        style: {
                                            display: 'flex',
                                            left: ex + left,
                                            top: y + top,
                                        },
                                        content: obj,
                                    })
                                },
                                onMouseOut: closeTips,
                                onClick: () => {
                                    closeTips()
                                    setdetailLocation(pushOrPop(detailLocation, key))
                                    const scalePower = Math.min(graphHeight / rectheight, graphWidth / rectWidth) / 2
                                    const transformX = ((graphWidth - rectWidth * scalePower) / 2 - sx) 
                                    const transformY = ((graphHeight - rectheight * scalePower) / 2 - y)
                                    if (detailLocation.includes(key)) {
                                        select(`.${className}`)
                                            .transition()
                                            .ease(easeLinear)
                                            .duration(100)
                                            .attr('transform', 'translate(0, 0)')
                                    } else {
                                        select('.stopLocationItem.active')
                                            .transition()
                                            .ease(easeLinear)
                                            .duration(100)
                                            .attr('transform', 'translate(0, 0)')
                                        select(`.${className}`)
                                            .transition()
                                            .ease(easeLinear)
                                            .duration(100)
                                            .attr('transform', `translate(${transformX} ${transformY}) scale(${scalePower})`)
                                    }
                                    
                                },
                            }
                            return (
                                <g {...gAttr}>
                                    <g className='stopBg' transform={`translate(${sx}, ${y})`}>
                                        <rect {...rectAttr} />
                                        <text dx={rectAttr.width / 2}>{d.location}</text>
                                    </g>
                                    <g className="stopDetail">
                                        {
                                            data.map(d1 => {
                                                const {st, et, location, range, id } = d1
                                                const carColor = calCarColor(id)
                                                const cx = timeScale(new Date(`2020-01-01 ${st.split(' ')[1]}`))
                                                const storeKey = `${range}-${location}`
                                                if(!obj[storeKey]) {
                                                    obj[storeKey] = 1
                                                } else {
                                                    obj[storeKey] = obj[storeKey] + 1
                                                }
                                                const cy = y + timeScaleObj[range][`${location}Scale`](obj[storeKey])
                                                const circleAttr = {
                                                    key: `${location}-${et}-${st}`,
                                                    transform: `translate(${cx}, ${cy})`,
                                                    stroke: carColor,
                                                    fill: carColor,
                                                    fillOpacity: .4,
                                                    r: 2,
                                                    onMouseEnter: () => {
                                                        console.log(d1)
                                                        const obj = {
                                                            car: id,
                                                            starttime: st,
                                                            endtime: et,
                                                            duration: `${d1.hour} hour`
                                                        }
                                                        settooltips({
                                                            style: {
                                                                display: 'flex',
                                                                left: cx + left,
                                                                top: cy + top,
                                                            },
                                                            content: obj,
                                                        })
                                                    }
                                                }
                                                return (
                                                    <circle {...circleAttr} />
                                                )
                                            })
                                        }
                                    </g>
                                </g>
                            )
                        })}
                    </g>
                </g>
                </g>
            </svg>
            <div className='location'>
                {stopLegend
                    .map(d => {
                        return (
                            <div className='location-classify' key={d.classify}>
                                <div className="classify-item">
                                    <div className="classify-item-label" style={{
                                        background: calcualteStoreColor(d.data[0])
                                    }} />
                                    <div className="classify-item-value">{d.classify}</div>
                                </div>
                                <div className="location-classify-cotent">
                                    {
                                        d.data.map(d1 => {
                                            const itemAttr = {
                                                className: `loaction-item ${disabledLocation.includes(d1) ? 'disabled' : ''}`,
                                                key: d1,
                                                onClick: () => {
                                                    setDisabledLocation(pushOrPop(disabledLocation, d1, 'mul'))
                                                }
                                            }
                                            return (
                                                <div {...itemAttr}>{d1}</div>
                                            )
                                        })
                                    } 
                                </div>
                            </div>
                        )
                    })}
            </div>
            {/* tooltips */}
            <div className="tooltips tooltips-location" style={tooltips.style}>
                    {Object.entries(tooltips.content).map(d => {
                        const [name, value] = d
                        return (
                            <div className="tooltip-line" key={name}>
                                <div className="tooltip-label">{name}:</div>
                                <div className="tooltip-value">{
                                    value.toString().split('/n').map(d1 => <span key={d1}>{d1}</span>)
                                }</div>
                            </div>
                        )
                    })}                        
            </div>
        </div>
    )
}
