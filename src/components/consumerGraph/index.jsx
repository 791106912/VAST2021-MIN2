import { ascending, extent } from 'd3-array'
import { json } from 'd3-fetch'
import { path } from 'd3-path'
import { forceCollide, forceLink, forceManyBody, forceSimulation, scaleLinear, scaleOrdinal, schemeCategory10, select, selectAll, color } from 'd3'
import { arc, curveCatmullRom, line, symbol, symbolSquare, symbolStar } from 'd3-shape'
import { chain } from 'lodash'
import moment from 'moment'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { ccLoyMap, storeButtonArr, storeClassify, storeMapType, timeArr, timeClassifyData } from '../../data/consumer_data'
import { add, calcualteStoreColor, calHourTime, pushOrPop } from '../../utils'
import './index.scss'
import systemStore from '../../page/system/store'
import { card_car_dict, car_card_dict } from '../../data/card_car_map'
import { toJS } from 'mobx'
import { observer } from 'mobx-react'

function calData(res) {
    const nodeData = Object.keys(ccLoyMap).map(d => {
        // const data = res.filter(d1 => d1.loyaltynum === d && d1.type === 'justCC')
        const data = res.filter(d1 => d1.loyaltynum === d)
        const location = chain(data).map('location').uniq().value()
        const type = chain(location).map(d => storeMapType[d]).sortBy().uniq().value()
        return {
            id: d,
            data,
            location,
            type,
            arcData: chain(data)
                .reduce((obj, d1) => {
                    obj[d1.locationType] = {
                        value: obj[d1.locationType]
                        ? add(obj[d1.locationType].value, d1.price)
                        : Number(d1.price),
                        type: d1.locationType,
                    }
                    return obj
                }, {})
                .values()
                .value()
        }
    })
    const linksObj = {}
    nodeData.forEach((d1) => {
        const key1 = d1.type.toString()
        nodeData.forEach(d2 => {
            if (d1.id === d2.id) return
            if (linksObj[`${d1.id}-${d2.id}`] || linksObj[`${d2.id}-${d1.id}`]) return
            const key2 = d2.type.toString()
            if(key1 !== key2) return
            // const sameLoaction = intersection(d1.location, d2.location)
            // const sameLoaction = d1.data
            //     .filter(d3 => {
            //         const a = d2.data.filter(d4 => 
            //             d4.location === d3.location
            //             && Math.abs(moment(d4.timestamp).diff(moment(d3.timestamp))) < 5 * 60 * 1000)
            //         return a.length
            //     })
            // const sameLoaction = []
            linksObj[`${d1.id}-${d2.id}`] = {
                source: d1.id,
                target: d2.id,
                value: 1
            }
        })
    })
    const nodes = nodeData
    const links = chain(linksObj).values().filter(d => d.value > 0).value()
    return [nodes, links]
}

function ConsumerGraph() {
    const [top, right, bottom, left] = [0,0,0,0]
    const containerRef = useRef(null)
    const [size, setsize] = useState({
        width: 300,
        height: 300,
    })

    const width = useMemo(() => size.width, [size])
    const height = useMemo(() => size.height, [size])

    const radiusArr = useMemo(() => {
        const maxSize = Math.min((width - left - right) / 2, (height - top - bottom) / 2)
        const minR = Math.max(maxSize / 4, 120)
        const item =  (maxSize - minR) / 3
        return [
            [0, minR], // card
            [minR, item * 2.5], // timeCircle
            [item * 4, item * 4 + 1], // timeLabel
            [item * 2.5 + 10, item * 4 - 10], // store
        ]
    }, [width, height])

    useEffect(() => {
        const { clientWidth, clientHeight } = containerRef.current
        setsize({
            width: clientWidth,
            height: clientHeight,
        })
    }, [])

    // 是否展示track 
    const [showTrack, setshowTrack] = useState(true)
    // 选中模式
    const [selectMode, setselectMode] = useState('mulitiple')

    const anagleScale = scaleLinear()
        .domain([0, 24])
        .range([0, 360])

    const dayScale = scaleLinear()
        .domain(extent(timeArr))
        .range([radiusArr[1][0], radiusArr[1][1]])

    const timeScale = scaleLinear()
        .domain([calHourTime('00:00:00'), calHourTime('23:59:59')])
        .range([0, Math.PI * 2])

    const consumePath = arc()
        .innerRadius(d => dayScale(d.day))
        .outerRadius(d => dayScale(d.day) + (radiusArr[1][1] - radiusArr[1][0]) / timeArr.length )
        .startAngle(d => timeScale(d.time))
        .endAngle(d => timeScale(d.time + 500))

    // getData
    const [originCCdata, setOriginCCdata] = useState([])

    // 选中
    const [activeStore, setActiveStore] = useState([])
    const [activeClassify, setActiveClassify] = useState([])
    const [activeCustom, setActiveCustom] = useState([])

    // ! store监听
    const { activeCar, changeActiveCar } = systemStore
    useEffect(() => {
        const hisCard = chain(activeCar)
            .map(carId => {
                const thisCard = car_card_dict[carId]
                if (typeof thisCard === 'string') {
                    return [thisCard]
                }
                return thisCard
            })
            .flatten()
            .value()
        setActiveCustom(hisCard)
    }, [activeCar])

    const [activeTime, setActiveTime] = useState([])

    // 展示的数据
    const consumeData = useMemo(() => {
        return originCCdata
        .filter(d => activeStore.length ? activeStore.includes(d.location) : true)
        .filter(d => activeCustom.length ? activeCustom.includes(d.id) : true)
        .filter(d => activeTime.length ? activeTime.includes(d.dayStr.replace('/2014', '')) : true)
    }, [activeStore, originCCdata, activeCustom, activeTime])

    // 所有的会员卡的ID
    const [ccNumData, setccNumData] = useState([])

    // 请求数据
    useEffect(() => {
        json('./data/merge_cc_and_loy.json').then(res => {
            const newConsumeData = res.map(d => {
                const [dayStr, hourStr] = d.timestamp.split(' ')
                const day = moment(dayStr).unix()
                const time = calHourTime(hourStr)
                const locationType = storeClassify.find(d1 => d1.data.includes(d.location)).type
                // 时间有点不准确
                return {
                    ...d,
                    day,
                    dayStr,
                    id: d.loyaltynum,
                    time,
                    locationType,
                    hour: hourStr.split(':')[0],
                }
            })
            const newLoy = chain(newConsumeData).map('id').uniq().value()
            setccNumData(newLoy)
            setOriginCCdata(newConsumeData)
            const [nodes, links] = calData(res)
            drawForce(nodes, links)
        })
    }, [])

    const drawForce = useMemo(() => {
        return (nodes, links) => {
            const distance = ([x1, y1], [x2, y2]) => Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
            const radius = radiusArr[0][1] - 20
            const force = forceSimulation(nodes)
                .force('links', forceLink(links)
                    .id(d => d.id)
                    .strength(d => 2)
                    // .distance(0)
                )
                .force('charge', forceManyBody()
                    .strength(-4)
                )
                .force('collide', forceCollide()
                    .radius(10)
                    // .iterations(20)
                )
                .force('circle', () => {
                    nodes.forEach((node, i) => {
                        if (distance([node.x, node.y], [0, 0]) > radius) {
                            const theta = Math.atan((node.y) / (node.x));
                            node.x = radius * Math.cos(theta) * (node.x < 0 ? -1 : 1);
                            node.y = radius * Math.sin(theta) * (node.x < 0 ? -1 : 1);
                          }
                    })
                })
            
            selectAll('.custom-item').each(function() {
                const id = select(this).attr('id')
                const thisData = nodes.filter(d => d.id === id)
                select(this).data(thisData)
            })

            select('.links')
                .selectAll('line').remove()
            const link = select('.links')
                .selectAll('line')
                .data(links)
                .enter()
                .append('line')
                .attr("stroke-width", d => 1)
                .attr("stroke", '#e9e9e9');

            force.on('tick', () => {
                link
                    .attr("x1", d => d.source.x)
                    .attr("y1", d => d.source.y)
                    .attr("x2", d => d.target.x)
                    .attr("y2", d => d.target.y);

                selectAll('.custom-item')
                    .attr('transform', d =>`translate(${d.x}, ${d.y})`)
            })
    }
    }, [])

    // 数据的信用卡
    const exitCCArr = useMemo(() => {
        return chain(consumeData)
            .map('id')
            .uniq()
            .value()
    }, [consumeData])

    // 剩余的价格比例尺
    const priceOpacity = useMemo(() => {
        const extents = extent(consumeData, d => Number(d.price))
        return scaleLinear()
        .domain(extents)
        .range([0.2, 1])
    }, [consumeData])

    const locationPriceObj = useMemo(() => {
        return consumeData.reduce((obj, d) => {
            const num = obj[d.location] || 0
            obj[d.location] = add(num, d.price)
            return obj
        }, {})
    }, [consumeData])

    // 地点消费比例尺
    const locationOpacity = useMemo(() => {
        const extents = extent(Object.values(locationPriceObj))
        return scaleLinear()
        .domain(extents)
        .range([0.2, 1])
    }, [locationPriceObj])
    
    // 商店列表
    const storePath = arc()
        .innerRadius(d => d.inner)
        .outerRadius(d => d.outer)
        .startAngle(d => timeScale(calHourTime(d.s)))
        .endAngle(d => timeScale(calHourTime(d.e)))
        .padAngle(.01)
        .cornerRadius(4)

    const timePath = arc()
        .innerRadius(d => radiusArr[2][0])
        .outerRadius(d => radiusArr[2][1])
        .startAngle(d => {
            if(d[0]<0) {
                return timeScale(moment(`2019-12-31 ${22}:00:00`).unix())
            }
            return timeScale(calHourTime(d[0]))
        })
        .endAngle(d => timeScale(calHourTime(d[1])))
        .padAngle(.1)
        .cornerRadius(4)

    const middleArcLine = d => {
        if (!d.innerRadius || !d.outerRadius) {
            return ''
        }
        const angles = [d.startAngle, d.endAngle].map(
            d1 => d1 - Math.PI / 2
        )
        const r1 = Math.max(0, (d.outerRadius + d.innerRadius) / 2)
        const middleAngle = (angles[1] + angles[0]) / 2
        const invertDirection = middleAngle > 0 && middleAngle < Math.PI
        if (invertDirection) angles.reverse()
        const pathFun = path()
        pathFun.arc(0, 0, r1, angles[0], angles[1], invertDirection)
        return pathFun.toString()
    }

    const colorScale = scaleOrdinal(storeClassify.map(d => d.type).sort(ascending), schemeCategory10)
    const pointObj = useMemo(() => {
        return ccNumData.reduce((obj, d) => {
            const thisData = chain(consumeData)
                .filter(d1 => d1.id === d)
                .filter(d1 => d1.type !== 'cash')
                .sortBy('time')
                .reduce((obj, d1) => {
                    const key = d1.dayStr
                    if (!obj[key]) obj[key] = []
                    obj[key].push(consumePath.centroid(d1))
                    return obj
                }, {})
                .values()
                .value()
            obj[d] = thisData
            return obj
        }, {})
    }, [ccNumData, consumeData, consumePath])

    const activeTimeData = useMemo(() => {
        return chain(consumeData)
            .map(d => d.dayStr.replace('/2014', ''))
            .uniq()
            .value()
    }, [consumeData])

    const trackPath = line()
        .x(d => d[0])
        .y(d => d[1])
        .curve(curveCatmullRom.alpha(0.5));

    const weekDay = ['01/11', '01/12', '01/18', '01/19']

    const [tooltips, settooltips] = useState({
        style: {
            display: 'none',
        },
        content: {}
    })

    function closeTooltips() {
        settooltips({
            style: {
                display: 'none',
            },
            content: {},
        })
    }

    return (
        <div className='consumerGraph'>
            <div className="left" ref={containerRef}>
                <svg height={height} width={width} className='main'>
                    <g transform={`translate(${left}, ${top})`}>
                        <g className="timebg">
                            {timeArr.map((d, i) => {
                                const text = moment(d * 1000).format('MM/DD')
                                const textOpactiy = activeTimeData.includes(text) ? 1 : .1
                                const textAttr = {
                                    opacity: textOpactiy,
                                    transform: `translate(${width / 2}, ${height /2 - dayScale(d)})`,
                                    cursor: 'pointer',
                                    className: `timeText ${activeTime.includes(text) ? 'active' : ''}`,
                                    onClick: () => {
                                        setActiveTime(pushOrPop(activeTime, text, selectMode))
                                    }
                                }
                                return <g key={d}>
                                    <text {...textAttr}>
                                        {text} {weekDay.includes(text) ? 'weekend' : ''}
                                    </text>
                                    <circle cx={width / 2} cy={height / 2} r={dayScale(d)} /> 
                                </g>
                            })}
                        </g>
                        <g className="timeTick">
                            {[6, 9, 12, 14, 18, 22].map((d, i) => {
                                const attr = {
                                    x1: width / 2,
                                    y1: height / 2 - radiusArr[2][0],
                                    x2: width / 2,
                                    y2: height / 2,
                                }
                                return (
                                    <g key={d} className='timeSplit' transform={`rotate(${anagleScale(d)})`}>
                                        <line {...attr} />
                                        <text x={attr.x1} y={attr.y1} dy={0}>{`${d}:00`}</text>
                                    </g>
                                )
                            })}
                        </g>
                        <g className="time-classify" transform={`translate(${width/2}, ${height / 2})`}>
                            {timeClassifyData.map((d, i) => {
                                const attr = {
                                    d: timePath(d.data),
                                }
                                const textPathHrefProps = {
                                    fill: 'none',
                                    id: `time-${i}`,
                                    d: middleArcLine({
                                        innerRadius: radiusArr[2][1] + 10,
                                        outerRadius: radiusArr[2][1]+10,
                                        startAngle: d.data[0] < 0 ? 
                                            timeScale(moment(`2019-12-31 ${22}:00:00`).unix())
                                            : timeScale(calHourTime(d.data[0])),
                                        endAngle: timeScale(calHourTime(d.data[1])),
                                    }),
                                }
                                const textPathProps = {
                                    href: `#time-${i}`,
                                    startOffset: '50%',
                                    dominantBaseline: 'middle',
                                }
                                return (
                                    <g key={d.data[0]}>
                                        <path {...attr} className='time-button' />
                                        <g className='time-label' >
                                            <path {...textPathHrefProps} />
                                            <text>
                                                <textPath {...textPathProps}>
                                                    {d.name}
                                                </textPath>
                                            </text>
                                        </g>
                                    </g>
                                )
                            })}
                        </g>
                        <g className='consume-g' transform={`translate(${width/2}, ${height / 2})`}>
                            {consumeData.filter(d => d.type !== 'cash').map((d, i) => {
                                const [x, y] = consumePath.centroid(d)
                                const color = calcualteStoreColor(d.location)
                                const opactiy = priceOpacity(d.price)
                                const size = 15
                                const attr = {
                                    key: JSON.stringify(d),
                                    className: 'consume-item',
                                    d: d.type === 'right' ?
                                        symbol().type(symbolSquare).size(size)()
                                        : symbol().type(symbolStar).size(size)(),
                                    fill: color,
                                    stroke: color,
                                    strokeOpacity: opactiy,
                                    fillOpacity: opactiy,
                                    transform: `translate(${x}, ${y})`,
                                    onMouseEnter: e => {
                                        const { clientX, clientY } = e
                                        const {x, y} = document.querySelector('.consumerGraph .left').getBoundingClientRect()
                                        const tx = clientX - x + 10
                                        const ty = clientY - y + 10
                                        settooltips({
                                            style: {
                                                display: 'block',
                                                left: tx,
                                                top: ty,
                                            },
                                            content: {
                                                loyaltynum: d.loyaltynum,
                                                location: d.location,
                                                time: d.timestamp,
                                                price: d.price,
                                                type: d.type,
                                            },
                                        })
                                    },
                                    onMouseOut: closeTooltips
                                }
                                return (
                                    <path {...attr} />
                                )
                            })}
                        </g>
                        <g className='detail-store' transform={`translate(${width/2}, ${height / 2})`}>
                        {
                                Object.entries(storeButtonArr).map((d, i) => {
                                    const [storeName, data] = d
                                    const type = storeMapType[storeName]
                                    return (
                                        <g key={storeName}>
                                            {
                                                data.map(d1 => {
                                                    const key = `${storeName}-${d1.s}`
                                                    const startAngle = timeScale(calHourTime(d1.s))
                                                    const endAngle = timeScale(calHourTime(d1.e))
                                                    const gap = (radiusArr[3][1] - radiusArr[3][0]) / 9
                                                    const inner = radiusArr[3][0] + gap * (d1.d - 1)
                                                    const outer = inner + gap
                                                    const attr = {
                                                        d: storePath({
                                                            inner,
                                                            outer,
                                                            s: d1.s,
                                                            e: d1.e,
                                                        }),
                                                        fill: colorScale(type),
                                                        stroke: colorScale(type),
                                                        fillOpacity: locationOpacity(locationPriceObj[storeName]),
                                                    }
                                                    const textPathHrefProps = {
                                                        fill: 'none',
                                                        id: `text-${key}`,
                                                        d: middleArcLine({
                                                            innerRadius: (inner + outer) / 2,
                                                            outerRadius: (inner + outer) / 2,
                                                            startAngle,
                                                            endAngle,
                                                        }),
                                                    }
                                                    const textPathProps = {
                                                        href: `#text-${key}`,
                                                        startOffset: '50%',
                                                        dominantBaseline: 'middle',
                                                        textAnchor: 'middle',
                                                    }
                                                    let className = activeStore.includes(storeName) ? 'active' : ''
                                                    if (activeStore.length > 0 && !activeStore.includes(storeName)) {
                                                        className = 'disabled'
                                                    }
                                                    const opacity = consumeData.map(d => d.location).includes(storeName) ? 1 : 0.1
                                                    const middle = (startAngle + endAngle) / 2
                                                    const isBottom = middle > Math.PI / 2 && middle < Math.PI / 2 * 3
                                                    const textData = isBottom ? storeName.split(' ').reverse() : storeName.split(' ')
                                                    const dy = isBottom ? -10 : 10
                                                    const gAttr = {
                                                        key,
                                                        opacity,
                                                        className,
                                                        onClick: () => {
                                                            const newActiveStore = pushOrPop(activeStore, storeName, selectMode)
                                                            const newType = chain(newActiveStore)
                                                                .map(d2 => storeMapType[d2])
                                                                .uniq()
                                                                .value()
                                                            setActiveStore(newActiveStore)
                                                            setActiveClassify(newType)
                                                        },
                                                        onMouseEnter: e => {
                                                            const { clientX, clientY } = e
                                                            const {x, y} = document.querySelector('.consumerGraph .left').getBoundingClientRect()
                                                            const tx = clientX - x + 10
                                                            const ty = clientY - y + 10
                                                            settooltips({
                                                                style: {
                                                                    display: 'block',
                                                                    left: tx,
                                                                    top: ty,
                                                                },
                                                                content: {
                                                                    name: storeName,
                                                                    'consume st': `${d1.s}`,
                                                                    'consume et': `${d1.e}`,
                                                                    'consume price': locationPriceObj[storeName],
                                                                    'card num': chain(consumeData).filter(d2 => d2.location === storeName).map('loyaltynum').uniq().value().length
                                                                }
                                                            })
                                                        },
                                                        onMouseOut: closeTooltips
                                                    }
                                                    return (
                                                        <g {...gAttr}>
                                                            <path {...attr} className='store-button' />
                                                            <g className='store-label'>
                                                                <path {...textPathHrefProps} />
                                                                <text>
                                                                <textPath {...textPathProps}>
                                                                    {storeName.split(' ').map(d => d[0]).join().replace(/,/g, '')}
                                                                </textPath>
                                                                </text>
                                                            </g>
                                                        </g>
                                                    )
                                                })
                                            }
                                        </g>
                                    )
                                })
                            }
                        </g>
                        <g className='customer' transform={`translate(${width/2}, ${height / 2})`}>
                            <circle className='bg' cx={0} cy={0} r={radiusArr[1][0]}/>
                            <g className='links' />
                            <g>
                                {
                                    ccNumData.map((d, i) => {
                                        const opacity = exitCCArr.includes(d) ? 1 : 0.1
                                        const thisConsumeData = originCCdata.filter(d1 => d1.id === d)
                                        const priceTotal = thisConsumeData
                                            .reduce((num, d1) => {
                                                return add(num, d1.price)
                                            }, 0)
                                        const priceCash = thisConsumeData.filter(d1 => d1.type === 'cash')
                                            .reduce((num, d1) => {
                                                return add(num, d1.price)
                                            }, 0)
                                        const priceJustCC = thisConsumeData.filter(d1 => d1.type === 'justCC')
                                            .reduce((num, d1) => {
                                                return add(num, d1.price)
                                            }, 0)
                                        const priceRight = thisConsumeData.filter(d1 => d1.type === 'right')
                                        .reduce((num, d1) => {
                                            return add(num, d1.price)
                                        }, 0)
                                        // console.log(priceA === priceB)
                                        // console.log(thisConsumeData.filter(d1 => d1.type === 'justCC'))
                                        const arcData = chain(thisConsumeData)
                                            .reduce((obj, d1) => {
                                                obj[d1.locationType] = {
                                                    value: obj[d1.locationType]
                                                    ? add(obj[d1.locationType].value, d1.price)
                                                    : Number(d1.price),
                                                    type: d1.locationType,
                                                }
                                                return obj
                                            }, {})
                                            .values()
                                            // .flatten()
                                            .value()
                                        const total = thisConsumeData.reduce((t, d1) => add(t, d1.price), 0)
                                        const thisAngleScale = scaleLinear()
                                            .domain([0, total])
                                            .range([0, 2 * Math.PI])
                                        const thisArcFun = arc()
                                            .innerRadius(0)
                                            .outerRadius(5)
                                            .startAngle(d1 => {
                                                const index = arcData.findIndex(d2 => d2.type === d1.type)
                                                const startValue = chain(arcData)
                                                    .slice(0, index)
                                                    .map('value')
                                                    .reduce((t, d2) => add(t, d2), 0)
                                                    .value()
                                                return thisAngleScale(startValue)
                                            })
                                            .endAngle(d1 => {
                                                const index = arcData.findIndex(d2 => d2.type === d1.type)
                                                const endValue = chain(arcData)
                                                    .slice(0, index)
                                                    .map('value')
                                                    .reduce((t, d2) => add(t, d2), 0)
                                                    .value() + d1.value
                                                return thisAngleScale(endValue)
                                            })
                                        const gAttr = {
                                            opacity,
                                            id: d,
                                            className: 'custom-item',
                                            transform: `translate(${i * 10}, ${0})`,
                                            onClick: () => {
                                                const thisCarId = card_car_dict[d]
                                                if (thisCarId) {
                                                    changeActiveCar(thisCarId)
                                                } else {
                                                    const newActiveClassisy = pushOrPop(activeCustom, d, selectMode)
                                                    console.log('none car')
                                                    setActiveCustom(newActiveClassisy)
                                                }
                                            },
                                            onMouseEnter: e => {
                                                const { clientX, clientY } = e
                                                const {x, y} = document.querySelector('.consumerGraph .left').getBoundingClientRect()
                                                const tx = clientX - x + 10
                                                const ty = clientY - y + 10
                                                settooltips({
                                                    style: {
                                                        display: 'block',
                                                        left: tx,
                                                        top: ty,
                                                    },
                                                    content: {
                                                        number: d,
                                                        total: priceTotal,
                                                        'justcc price': priceJustCC,
                                                        'cash price': priceCash,
                                                        'right price': priceRight,
                                                    }
                                                })
                                            },
                                            onMouseOut: closeTooltips
                                        }
                                        return (
                                            <g {...gAttr}>
                                                {
                                                    arcData.map(d1 => {
                                                        const attr = {
                                                            d: thisArcFun(d1),
                                                            key: `small-${d1.type}`,
                                                            fill: colorScale(d1.type),
                                                            stroke: colorScale(d1.type),
                                                            fillOpacity: .3,
                                                        }
                                                        return <path {...attr}/>
                                                    })
                                                }
                                                <text
                                                    dy={-8}
                                                >
                                                    {d}
                                                </text>
                                            </g>
                                        )
                                    })
                                }
                            </g>
                        </g>
                        <g className='customerTrack' transform={`translate(${width/2}, ${height / 2})`}>
                            {
                                Object.entries(pointObj)
                                    .map(d => {
                                        const [name, data] = d
                                        let opacity = activeCustom.includes(name) ? 1 : 0
                                        // let opacity = consumeData.map(d1 => d1.id).includes(name) ? 1 : 0
                                        if (opacity) {
                                            opacity = showTrack ? 1 : 0
                                        }
                                        return (
                                            <g opacity={opacity} key={name}>
                                                {data.map(d1 => {
                                                    return <path d ={trackPath(d1)} key={d1.toString()} />
                                                })}
                                            </g>
                                            
                                        )
                                    })
                            }
                        </g>
                    </g>
                </svg>
                <div className="tooltips" style={tooltips.style}>
                    {Object.entries(tooltips.content).map(d => {
                        return (
                            <div className="tooltip-line" key={d[0]}>
                                <div className="tooltip-label">{d[0]}: </div>
                                <div className="tooltip-value">{d[1]}</div>
                            </div>
                        )
                    })}
                </div>
            </div>
            <div className='right'>
                <div className='condition'>
                    <div className="item">
                        select mode：
                        {['single', 'mulitiple'].map(d => {
                            return (
                                <>
                                    <label htmlFor={d}>{d}</label>
                                    <input
                                        type='radio'
                                        name='select-mode'
                                        checked={selectMode === d}
                                        onChange={() => {
                                            if (selectMode !== d) {
                                                setselectMode(d)
                                            }
                                        }}
                                        value={d}
                                        id={d}
                                    />
                                </>
                            )
                        })}
                    </div>
                    <div className='item'>
                        show customer track：
                        <input
                            type='checkbox'
                            name='track-mode'
                            checked={showTrack}
                            onChange={() => {
                                setshowTrack(!showTrack)
                            }}
                        />
                    </div>
                    {/* <div className='item'>
                        merge method：
                        {['union', 'intersection'].map(d => {
                            return (
                                <>
                                    <label htmlFor={d}>{d}</label>
                                    <input
                                        type='radio'
                                        name='merge-mode'
                                        checked={mergefun === d}
                                        onChange={() => {
                                            if (mergefun !== d) {
                                                setMergeFun(d)
                                            }
                                        }}
                                        value={d}
                                        id={d}
                                    />
                                </>
                            )
                        })}
                    </div> */}
                    <div className='item'>
                        <button onClick={() => {
                            setActiveStore([])
                            setActiveClassify([])
                            setActiveCustom([])
                        }}>Refresh</button>
                    </div>
                </div>
                <div className='legend'>
                    {storeClassify.map(d => {
                        const { type } = d
                        const originColor = colorScale(type)
                        let bgColor = color(originColor)
                        bgColor.opacity = .6
                        bgColor += ''
                        let className = activeClassify.includes(type) ? 'active' : ''
                        if (activeClassify.length > 0 && !activeClassify.includes(type)) {
                            className = 'disabled'
                        }
                        return (
                            <div className={`legend-item ${className}`} onClick={() => {
                                const newActiveClassisy = pushOrPop(activeClassify, type, selectMode)
                                setActiveClassify(newActiveClassisy)
                                const newActiveStore = chain(storeClassify)
                                    .filter(d1 => newActiveClassisy.includes(d1.type))
                                    .map('data')
                                    .flatten()
                                    .value()
                                setActiveStore(newActiveStore)
                            }}>
                                <div className='legend-label' style={{
                                    backgroundColor: bgColor,
                                    borderColor: originColor,
                                }} />
                                <div className='legend-name'>{type}</div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}

export default observer(ConsumerGraph)