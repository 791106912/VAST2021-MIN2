import { ascending, extent } from 'd3-array'
import { csv } from 'd3-fetch'
import { path } from 'd3-path'
import { axisLeft, drag, scaleBand, scaleLinear, scaleOrdinal, scalePoint, schemeCategory10, select } from 'd3'
import { arc, curveCatmullRom, line } from 'd3-shape'
import { chain, intersection, set } from 'lodash'
import moment from 'moment'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { storeClassify, timeArr, timeClassifyData } from './data'
import './index.scss'

export default function FirstQ() {
    const [height, width] = [800, 800]

    const [top, right, bottom, left] = [10,10,10,10]

    const realHeight = height - top - bottom
    const realWidth = width - left - right

    const radiusArr = [
        [0, 100], // card
        [100, 240], // timeCircle
        [370, 371], // timeLabel
        [270, 300], // store
        [320, 350], // classify
    ]


    const anagleScale = scaleLinear()
        .domain([0, 24])
        .range([0, 360])

    const dayScale = scaleLinear()
        .domain(extent(timeArr))
        .range([radiusArr[1][0], radiusArr[1][1]])

    const dayStr = '2020-01-01'

    // 是否展示track 
    const [showTrack, setshowTrack] = useState(true)

    // 选中模式
    const [selectMode, setselectMode] = useState('mulitiple')

    function pushOrPop(arr, d) {
        const newArr = [...arr]
        if (selectMode !== 'single') {
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

    const timeScale = scaleLinear()
        .domain([`${dayStr} 00:00:00`, `${dayStr} 23:59:59`].map(d => moment(d).unix()))
        .range([0, Math.PI * 2])

    const consumePath = arc()
        .innerRadius(d => dayScale(d.day))
        .outerRadius(d => dayScale(d.day) + (radiusArr[1][1] - radiusArr[1][0]) / timeArr.length )
        .startAngle(d => {
            // console.log(d.ti)
            return timeScale(d.time)
        })
        .endAngle(d => timeScale(d.time + 500))

    // getData
    const [originCCdata, setOriginCCdata] = useState([])

    // 选中
    const [activeStore, setActiveStore] = useState([])
    const [activeClassify, setActiveClassify] = useState([])
    const [activeCustom, setActiveCustom] = useState([])

    const consumeData = useMemo(() => {
        return originCCdata
        .filter(d => activeStore.length ? activeStore.includes(d.location) : true)
        .filter(d => activeCustom.length ? activeCustom.includes(d.last4ccnum) : true)
    }, [activeStore, originCCdata, activeCustom])
    const [ccNumData, setccNumData] = useState([])

    const priceOpacity = useMemo(() => {
        const extents = extent(consumeData, d => Number(d.price))
        return scaleLinear()
        .domain(extents)
        .range([0.2, 1])
    }, [consumeData])

    useEffect(() => {
        const cc  = new Promise(resolve => {
            csv('/data/cc_data.csv').then(res => {
                console.log(res)
                const newConsumeData = res.map(d => {
                    const [dayStrs, hourStr] = d.timestamp.split(' ')
                    const day = moment(dayStrs).unix()
                    const time = moment(`${dayStr} ${hourStr}:00`).unix()
                    // 时间有点不准确
                    return {
                        ...d,
                        day,
                        dayStr: dayStrs,
                        time,
                        hour: hourStr.split(':')[0],
                    }
                })
                const newLoy = chain(res).map('last4ccnum').uniq().value()
                setccNumData(newLoy)
                setOriginCCdata(newConsumeData)
                resolve(res)
            })
        })
        const loy = new Promise(resolve => {
            csv('/data/loyalty_data.csv').then(res => {
                resolve(res)
            })
        })
        Promise.all([cc, loy]).then(res => {
            // draw(res)
            // calcualteTimeData(res[0])
            // calculateLocationData(res[0], res[1])
        })
    }, [])

    const locationPriceObj = useMemo(() => {
        return consumeData.reduce((obj, d) => {
            const num = obj[d.location] || 0
            const newNum = parseFloat((num + Number(d.price)).toFixed(10))
            obj[d.location] = newNum
            return obj
        }, {})
    }, [consumeData])

    const locationOpacity = useMemo(() => {
        const extents = extent(Object.values(locationPriceObj))
        return scaleLinear()
        .domain(extents)
        .range([0.2, 1])
    }, [locationPriceObj])
    
    // store
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
            return timeScale(moment(`${dayStr} ${d[0]}:00:00`).unix())
        })
        .endAngle(d => timeScale(moment(`${dayStr} ${d[1]}:00:00`).unix()))
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
                .filter(d1 => d1.last4ccnum === d)
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
                                    {/* <circle cx={attr.x1} cy={attr.y1} r={4} /> */}
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
                                        : timeScale(moment(`${dayStr} ${d.data[0]}:00:00`).unix()),
                                    endAngle: timeScale(moment(`${dayStr} ${d.data[1]}:00:00`).unix()),
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
                        {consumeData.map((d, i) => {
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
                                        const newActiveClassisy = pushOrPop(activeClassify, type)
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
                                            const textPathHrefProps = {
                                                fill: 'none',
                                                id: `text-${d}`,
                                                d: middleArcLine({
                                                    innerRadius: radiusArr[3][0],
                                                    outerRadius: radiusArr[3][1],
                                                    startAngle: storeClassifyScale(count + i),
                                                    endAngle: storeClassifyScale(count + i + 1),
                                                }),
                                            }
                                            const textPathProps = {
                                                href: `#text-${d}`,
                                                startOffset: '50%',
                                                dominantBaseline: 'middle',
                                            }
                                            let className = activeStore.includes(d) ? 'active' : ''
                                            if (activeStore.length > 0 && !activeStore.includes(d)) {
                                                className = 'disabled'
                                            }
                                            const opacity = consumeData.map(d => d.location).includes(d) ? 1 : 0.1
                                            return (
                                                <g key={d} opacity={opacity} className={className} onClick={() => {
                                                    const newActiveStore = pushOrPop(activeStore, d)
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
                                                            <textPath {...textPathProps}>
                                                                {d.split(' ').map((d1, j) => (
                                                                    <tspan y={j * 10} key={d1}>{d1}</tspan>
                                                                ))}
                                                            </textPath>
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
                        <g>
                            {
                                ccNumData.map((d, i) => {
                                    const golden_angle = Math.PI * (3 - Math.sqrt(5))
                                    const theta = i * golden_angle
                                    const r = Math.sqrt(i) / Math.sqrt(ccNumData.length)
                                    const cx = (radiusArr[1][0] - 10) * (r * Math.cos(theta))
                                    const cy = (radiusArr[1][0] - 10) * (r * Math.sin(theta))
                                    const opacity = consumeData.map(d1 => d1.last4ccnum).includes(d) ? 1 : 0.1
                                    let className = activeCustom.includes(d) ? 'active' : ''
                                    if (activeCustom.length > 0 && !activeCustom.includes(d)) {
                                        className = 'disabled'
                                    }
                                    return (
                                        <g
                                            transform={`translate(${cx}, ${cy})`}
                                            opacity={opacity}
                                            onClick={() => {
                                                const newActiveScatter = pushOrPop(activeCustom, d)
                                                setActiveCustom(newActiveScatter)
                                            }}
                                        >
                                            <circle key={d} r={5} className={`card ${className}`} />
                                            <text>{d}</text>
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
                                    // let opacity = consumeData.map(d1 => d1.last4ccnum).includes(name) ? 1 : 0
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
                        <button onClick={() => {
                            setActiveStore([])
                            setActiveClassify([])
                            setActiveCustom([])
                        }}>Refresh</button>
                    </div>
                </div>
                <Parallel data={consumeData} />
            </div>
        </div>
    )
}


function Parallel({ data = []}) {
    const [top, right, bottom, left] = [20, 20, 20, 80]
    const [width, height] = [600, 500] 

    const realHeight = height - top - bottom
    const realWidth = width - left - right

    const bgRef = useRef(null)
    const pathRef = useRef(null)

    useEffect(() => {
        const location = chain(data).map('location').uniq().value()
        const name = chain(data).map('last4ccnum').uniq().value()
        const time = chain(data).map('hour').uniq().value()

        const scaleObj = {
            last4ccnum: scalePoint()
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