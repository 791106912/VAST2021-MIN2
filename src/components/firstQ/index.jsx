import { ascending, extent } from 'd3-array'
import { json } from 'd3-fetch'
import { path } from 'd3-path'
import { event, axisLeft, drag, forceCenter, forceCollide, forceLink, forceManyBody, forceSimulation, scaleLinear, scaleOrdinal, scalePoint, schemeCategory10, select, selectAll } from 'd3'
import { arc, curveCatmullRom, line } from 'd3-shape'
import { chain, intersection, max } from 'lodash'
import moment from 'moment'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { ccLoyMap, storeClassify, storeMapType, timeArr, timeClassifyData } from '../../data/consumer_data'
import './index.scss'
import { add, calHourTime, pushOrPop } from '../../utils'


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

export default function FirstQ() {
    const [height, width] = [800, 800]

    const [top, right, bottom, left] = [10,10,10,10]

    const realHeight = height - top - bottom
    const realWidth = width - left - right

    const radiusArr = [
        [0, 140], // card
        [140, 240], // timeCircle
        [370, 371], // timeLabel
        [270, 300], // store
        [320, 350], // classify
    ]
    // 是否展示track 
    const [showTrack, setshowTrack] = useState(true)
    // 选中模式
    const [selectMode, setselectMode] = useState('mulitiple')
    // MergeMethod
    const [mergefun, setMergeFun] = useState('intersection')

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

    // 展示的数据
    const consumeData = useMemo(() => {
        return originCCdata
        .filter(d => activeStore.length ? activeStore.includes(d.location) : true)
        .filter(d => activeCustom.length ? activeCustom.includes(d.id) : true)
    }, [activeStore, originCCdata, activeCustom])

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
        window.arr = []
        return (nodes, links) => {
            const distance = ([x1, y1], [x2, y2]) => Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
            const radius = radiusArr[0][1] - 30
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
            .call(
                drag()
                    .on('start', (d) => {
                        const alpha = Math.max(force.alpha(), 0.1)
                        force.alpha(alpha).restart()
                        d.fx = null
                        d.fy = null
                    })
                    .on('drag', d=> {
                        d.x = event.x
                        d.y = event.y
                    })
                    .on('end', d=>{
                        d.fx = event.x
                        d.fy = event.y
                    })
            )

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
    const storeArr = chain(storeClassify)
        .map('data')
        .flatten()
        .value()

    const storeClassifyScale = scaleLinear()
        .domain([0, storeArr.length])
        .range([0, Math.PI * 2])

    const storeClassifyPath = arc()
        .innerRadius(d => radiusArr[4][0])
        .outerRadius(d => radiusArr[4][1])
        .startAngle(d => {
            const {type} = d
            const index = storeClassify.findIndex(d => d.type === type)
            const count = chain(storeClassify)
                .slice(0, index)
                .map('data')
                .flatten()
                .value()
                .length
            return storeClassifyScale(count)
        })
        .endAngle(d => {
            const {type} = d
            const index = storeClassify.findIndex(d => d.type === type)
            const count = chain(storeClassify)
                .slice(0, index + 1)
                .map('data')
                .flatten()
                .value()
                .length
            return storeClassifyScale(count)
        })
        .padAngle(.01)
        .cornerRadius(4)

    const storePath = arc()
        .innerRadius(d => radiusArr[3][0])
        .outerRadius(d => radiusArr[3][1])
        .startAngle(d => {
            const index = storeArr.indexOf(d)
            return storeClassifyScale(index)
        })
        .endAngle(d => {
            const index = storeArr.indexOf(d)
            return storeClassifyScale(index + 1)
        })
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
    return (
        <div className='graph'>
            <svg height={height} width={width} className='main'>
                <g transform={`translate(${left}, ${top})`}>
                    <g className="timebg">
                        {timeArr.map((d, i) => {
                            const text = moment(d * 1000).format('MM/DD')
                            const textOpactiy = activeTimeData.includes(text) ? 1 : 0
                            return <g key={d}>
                                <text opacity={textOpactiy} transform={`translate(${width / 2}, ${height /2 - dayScale(d)})`}>
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
                            const storeType = storeClassify.find(d1 => d1.data.includes(d.location)).type
                            const attr = {
                                className: 'consume-item',
                                d: consumePath(d),
                                fill: colorScale(storeType),
                                fillOpacity: priceOpacity(d.price),
                            }
                            return (
                                <path key={JSON.stringify(d)} {...attr} />
                            )
                        })}
                    </g>
                    <g className='first-classify' transform={`translate(${width / 2}, ${height / 2})`}>
                        {storeClassify.map((d, i) => {
                            const {type, data} = d
                            const attr = {
                                d: storeClassifyPath(d),
                                fill: colorScale(type),
                                stroke: colorScale(type),
                            }
                            const index = storeClassify.findIndex(d1 => d1.type === type)
                            const count = chain(storeClassify)
                                .slice(0, index)
                                .map('data')
                                .flatten()
                                .value()
                                .length
                            const textPathHrefProps = {
                                fill: 'none',
                                id: `text-${type}`,
                                d: middleArcLine({
                                    innerRadius: radiusArr[4][0],
                                    outerRadius: radiusArr[4][1],
                                    startAngle: storeClassifyScale(count),
                                    endAngle: storeClassifyScale(count + data.length),
                                }),
                            }
                            const textPathProps = {
                                href: `#text-${type}`,
                                startOffset: '50%',
                                dominantBaseline: 'middle',
                            }
                            let className = activeClassify.includes(type) ? 'active' : ''
                            if (activeClassify.length > 0 && !activeClassify.includes(type)) {
                                className = 'disabled'
                            }
                            const opacity = intersection(consumeData.map(d1 => d1.location), data).length ? 1 : 0.1;
                            return (
                                <g key={d.type} className={className}
                                    opacity={opacity}
                                    onClick={() => {
                                        const newActiveClassisy = pushOrPop(activeClassify, type, selectMode)
                                        setActiveClassify(newActiveClassisy)
                                        const newActiveStore = chain(storeClassify)
                                            .filter(d1 => newActiveClassisy.includes(d1.type))
                                            .map('data')
                                            .flatten()
                                            .value()
                                        setActiveStore(newActiveStore)
                                    }}
                                >
                                    <path {...attr} className='classify-button' />
                                    <g className='classify-label'>
                                        <path {...textPathHrefProps} />
                                        <text>
                                            <textPath {...textPathProps}>
                                                {d.type}
                                            </textPath>
                                        </text>
                                    </g>
                                </g>
                            )
                        })}
                    </g>
                    <g className='detail-store' transform={`translate(${width/2}, ${height / 2})`}>
                        {
                        storeClassify.map((d1, j) => {
                            const {type, data} = d1
                            const count = chain(storeClassify)
                                .slice(0, j)
                                .map('data')
                                .flatten()
                                .value()
                                .length

                            return (
                                <g key={`a-${type}`}>
                                    {
                                        data.map((d, i) => {
                                            const attr = {
                                                d: storePath(d),
                                                fill: colorScale(type),
                                                stroke: colorScale(type),
                                                fillOpacity: locationOpacity(locationPriceObj[d]),
                                            }
                                            const startAngle = storeClassifyScale(count + i)
                                            const endAngle = storeClassifyScale(count + i + 1)
                                            const textPathHrefProps = {
                                                fill: 'none',
                                                id: `text-${d}`,
                                                d: middleArcLine({
                                                    innerRadius: radiusArr[3][1],
                                                    outerRadius: radiusArr[3][1],
                                                    startAngle,
                                                    endAngle,
                                                }),
                                            }
                                            const textPathProps = {
                                                href: `#text-${d}`,
                                                startOffset: '50%',
                                                dominantBaseline: 'middle',
                                                textAnchor: 'middle',
                                            }
                                            let className = activeStore.includes(d) ? 'active' : ''
                                            if (activeStore.length > 0 && !activeStore.includes(d)) {
                                                className = 'disabled'
                                            }
                                            const opacity = consumeData.map(d => d.location).includes(d) ? 1 : 0.1
                                            const middle = (startAngle + endAngle) / 2
                                            const isBottom = middle > Math.PI / 2 && middle < Math.PI / 2 * 3
                                            const textData = isBottom ? d.split(' ').reverse() : d.split(' ')
                                            const dy = isBottom ? -10 : 10
                                            return (
                                                <g key={d} opacity={opacity} className={className} onClick={() => {
                                                    const newActiveStore = pushOrPop(activeStore, d, selectMode)
                                                    const newType = storeClassify
                                                        .filter(d1 => d1.data.filter(d2 => newActiveStore.includes(d2)).length)
                                                        .map(d1 => d1.type)
                                                    setActiveStore(newActiveStore)
                                                    setActiveClassify(newType)
                                                }}>
                                                    <path {...attr} className='store-button' />
                                                    <g className='store-label'>
                                                        <path {...textPathHrefProps} />
                                                        <text>
                                                            {
                                                                textData.map((d1, j) => (
                                                                    <textPath {...textPathProps} key={d1}>
                                                                        <tspan dy={dy}>{d1}</tspan>
                                                                    </textPath>
                                                                ))
                                                            }
                                                        </text>
                                                    </g>
                                                </g>
                                            )
                                        })
                                    }
                                </g>
                            )
                        })}
                    </g>
                    <g className='customer' transform={`translate(${width/2}, ${height / 2})`}>
                        <circle className='bg' cx={0} cy={0} r={radiusArr[1][0]}/>
                        <g className='links' />
                        <g>
                            {
                                ccNumData.map((d, i) => {
                                    const opacity = exitCCArr.includes(d) ? 1 : 0.1
                                    const thisConsumeData = originCCdata.filter(d1 => d1.id === d)
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
                                    return (
                                        <g
                                            opacity={opacity}
                                            id={d}
                                            className='custom-item'
                                            transform={`translate(${i * 10}, ${0})`}
                                            onClick={() => {
                                                const newActiveClassisy = pushOrPop(activeCustom, d, selectMode)
                                                setActiveCustom(newActiveClassisy)
                                            }}
                                        >
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
            <div className='left'>
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
                    <div className='item'>
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
                    </div>
                    <div className='item'>
                        <button onClick={() => {
                            setActiveStore([])
                            setActiveClassify([])
                            setActiveCustom([])
                        }}>Refresh</button>
                    </div>
                </div>
                {/* <Parallel data={consumeData} colorScale={colorScale} /> */}
            </div>
        </div>
    )
}


function Parallel({ data = [], colorScale}) {
    const [top, right, bottom, left] = [20, 20, 20, 80]
    const [width, height] = [600, 500] 

    const realHeight = height - top - bottom
    const realWidth = width - left - right

    const bgRef = useRef(null)
    const pathRef = useRef(null)

    useEffect(() => {
        const location = chain(data).map('location').uniq().value()
        const name = chain(data).map('id').uniq().value()
        const time = chain(data).map('hour').uniq().value()

        const scaleObj = {
            id: scalePoint()
                .domain(name)
                .range([0, realHeight]),
            dayStr: scalePoint()
                .domain(timeArr.map(d => moment(d * 1000).format('MM/DD/YYYY')))
                .range([0, realHeight]),
            hour: scaleLinear()
                .domain([0, 24])
                // .domain(extent(time))
                .range([0, realHeight]),
            location: scalePoint()
                .domain(location)
                .range([0, realHeight]),
            price: scaleLinear()
                .domain([0, extent(data, d => Number(d.price))[1]].reverse())
                .range([0, realHeight]),
        }

        const xScale = scalePoint()
            .domain(Object.keys(scaleObj))
            .range([0, realWidth])

        select(bgRef.current)
            .selectAll('g.axisx')
            .remove()
        select(bgRef.current)
            .selectAll('g.axisx')
            .data(Object.keys(scaleObj))
            .enter()
            .append('g')
            .classed('axisx', true)
            .attr('transform', d => {
                return `translate(${xScale(d)}, ${0})`
            })
            .each(function append(d) {
                const axis = axisLeft()
                    .scale(scaleObj[d])
                    // .tickSize(10)
                select(this).call(axis)
            })

        const calLine = line()
        const path = d => {
            return calLine(
                Object.keys(scaleObj)
                    .map(key => [xScale(key), scaleObj[key](d[key])])
            )
        }

        select(pathRef.current)
            .selectAll('path')
            .remove()
        
        select(pathRef.current)
            .selectAll('path')
            .data(data)
            .enter()
            .append('path')
            .attr('d', path)
            .attr('stroke', d => {
                const { location } = d
                const type = storeClassify.find(d1 => d1.data.includes(location)).type
                return colorScale(type)
            })
    }, [data])

    return (
        <svg height={height} width={width} className='parallel'>
            <g transform={`translate(${left}, ${top})`}>
                <g ref={pathRef} className='path'/>
                <g ref={bgRef}/>
            </g>
        </svg>
    )
}