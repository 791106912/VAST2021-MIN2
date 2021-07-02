import { json } from 'd3-fetch'
import { geoEquirectangular, geoPath } from 'd3-geo'
import { scaleLinear, scaleOrdinal, scalePoint, scaleTime } from 'd3-scale'
import { line, schemeCategory10, brush, extent, easeLinear, axisTop, axisBottom, brushX, path } from 'd3'
import { select, selectAll, event } from 'd3-selection'
import { chain } from 'lodash'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import './index.scss'
import moment from 'moment'
import { carAssign, dayStr, storeMapType } from '../data/consumer_data'
import { building_coordinate } from '../data/buliding_coordinate'
import { calcualteTypeColor, calHourTime, findLocaiton } from '../utils'

function pushOrPop(arr, d) {
    const newArr = [...arr]
    if (newArr.includes(d)) {
        return newArr.filter(d1 => d1 !== d)
    }
    newArr.push(d)
    return newArr
}

export default function SecondQ() {
    const [ width, height ] = [1000, 600]
    const mapRef = useRef(null)
    const trackRef = useRef(null)

    const [map, setmap] = useState([])
    const [allTrack, setAllTrack] = useState([])

    const projection = useMemo(() => geoEquirectangular(), [])
    const colorScale = useMemo(() => 
        scaleOrdinal()
            .domain(allTrack.map(d => d.id))
            .range(schemeCategory10)
    ,[allTrack])


    const [selectCar, setSelectCard] = useState([])
    const [selectDay, setSelectDay] = useState(dayStr)
    const [selectHour, setSelectHour] = useState(['00:00:00', '23:59:59'].map(d => calHourTime(d)))

    const carArr = useMemo(() =>{
        const res = chain(allTrack)
            .map('id')
            .uniq()
            .map(d => {
                const info = carAssign.find(d1 => d1.CarID === d)
                if (info) {
                    return {
                        id: d,
                        name: `${info.FirstName} ${info.LastName}`,
                        type: info.CurrentEmploymentType,
                        title: info.CurrentEmploymentTitle,
                    }
                }
                return {
                    id: d,
                }
            })
            .value()
        // setSelectCard(res.map(d => d.id))
        return res
    } ,[allTrack])

    useEffect(() => {
        json('./data/map.json').then(res => {
            projection.fitSize([width, height], res)
            window.projection = projection
            setmap(res.features)
            json('./data/gpswithstop.json').then(res => {
                // calStopArr(projection)
                setAllTrack(res)
            })
        })
    }, [])

    const brushRef = useRef(null)
    useEffect(() => {
        select(brushRef.current)
            .call(
                brush()
                .extent([[0,0], [width, height]])
                .on('end', e => {
                    const {selection} = event
                    if(!selection) {
                        return 
                    }
                    const arr = []
                    console.log(selection.map(d => projection.invert(d)))
                    selectAll('.stopDot')
                        .filter(function () {
                            return selection[0][0] <= select(this).attr('cx')
                            && selection[1][0] >= select(this).attr('cx')
                            && selection[0][1] <= select(this).attr('cy')
                            && selection[1][1] >= select(this).attr('cy')
                        })
                        .each(function (){
                            arr.push(JSON.parse(select(this).attr('data')))
                        })

                    console.log(arr)
                })
            )
    }, [])

    const showTrack = useMemo(() => {
        return allTrack.filter(d => selectCar.includes(d.id))
    }, [selectCar, allTrack])

    const stopArr = useMemo(() => {
        return chain(showTrack)
            .map(d => d.stopArr)
            .flatten()
            .filter(d1 => selectDay.includes(d1.st.split(' ')[0]))
            .filter(d1 => {
                const hour = d1.st.split(' ')[1]
                const thisTime = calHourTime(hour)
                return thisTime >= selectHour[0] && thisTime <= selectHour[1]
            })
            .value()
    }, [selectDay, selectHour, showTrack])

    const stopCircleRScale = useMemo(() => {
        const domain = showTrack.length ? extent(
            chain(showTrack).map('stopArr').flatten().value(),
            d => d.gap
        ) : [0, 0]
        return scaleLinear()
            .domain(domain)
            .range([5, 5])
    }, [showTrack])


    const [tooltip, setTooltip] = useState({
        style: {
            display: 'none',
        },
        content: {
            
        },
    })

    function mouseenter(e, content) {
        setTooltip({
            style: {
                display: 'block',
                left: e.clientX + 10,
                top: e.clientY + 10,
            },
            content,
        })
    }
    

    function play() {
        selectAll('.trackItem')
            .each(function(){
                const path = select(this).select('.path')
                const length = path.node().getTotalLength()
                path
                    .attr("stroke-dasharray", length + " " + length)
                    .attr("stroke-dashoffset", length)
                    .transition()
                    .ease(easeLinear)
                    .attr("stroke-dashoffset", 0)
                    .duration(10000)

                const arrow = select(this).select('.arrow')
                arrow
                    .attr("stroke-width", 10)
                    .attr("stroke-dasharray", function() {
                    return [10, length - 10];
                    })
                    .attr("stroke-dashoffset", length)
                    .transition()
                    .ease(easeLinear)
                    .attr("stroke-dashoffset", 10 + .5)
                    .duration(10000)
                // .on("end", () => setTimeout(repeat, 1000));
            })
    }

    return (
        <div className='second-graph'>
            <div>
            <img src='./data/bg.jpeg' className='realMap' alt='map' />
            </div>
            
            <div className='tooltip' style={tooltip.style}>
                {Object.entries(tooltip.content).map(d => {
                    const [key, value] = d
                    return (
                        <div className='tooltip-item' key={key}>
                            <span className='tooltips-label'>{key}: </span>
                            <span className='tooltips-value'>{value}</span>
                        </div>
                    )
                })}
            </div>
            <div className='mapcontainer'>
                <svg height={height} width={width} className='mapSvg'>
                    <g className="bg">
                        <g className="map" ref={mapRef}>
                            {map.map((d, i) => (
                                <path key={i} className='map-item' d={geoPath(projection)(d)}/>
                            ))}
                        </g>
                        <g ref={brushRef} />
                        <g className="track" ref={trackRef}>
                            {showTrack
                                .map(d => {
                                    const { id, data } = d
                                    const geoArr = data
                                        .filter(d1 => selectDay.includes(d1.Timestamp.split(' ')[0]))
                                        .filter(d1 => {
                                            const hour = d1.Timestamp.split(' ')[1]
                                            const thisTime = calHourTime(hour)
                                            return thisTime >= selectHour[0] && thisTime <= selectHour[1]
                                        })
                                        .map(d1 => projection([d1.long, d1.lat]))

                                    const attr = {
                                        stroke: colorScale(id),
                                        d: line()(geoArr),
                                        className: 'path'
                                    }
                                    const attr2 = {
                                        strokeWidth: 10,
                                        className: 'arrow',
                                        d: line()(geoArr),
                                        strokeDasharray: [10, 100000 - 10],
                                    }
                                    return (
                                        <g className={`trackItem trackItem-${id}`} key={id}>
                                            <path {...attr} />
                                            <path {...attr2} />
                                        </g>
                                    )
                                }
                            )}
                        </g>
                        <g className="stop">
                            {stopArr.map((d,i) => {
                                const { id, long, lat, gap } = d
                                const [cx, cy] = projection([long, lat])
                                const keyItem = `${long}_${lat}_${id}`
                                const className = `stopitem_${keyItem}`
                                const attr = {
                                    cx, cy,
                                    r: stopCircleRScale(gap),
                                    key: keyItem,
                                    fill: colorScale(id),
                                    stroke: colorScale(id),
                                    // fill: 'red',
                                    className: `stopDot ${className}`,
                                    data: JSON.stringify(d),
                                }
                                return (
                                    <circle {...attr}/>
                                )
                            })}
                        </g>
                        <g className='store'>
                            {building_coordinate.map(d => {
                                const {range, name} = d
                                const cpname = name.replace(/'|\.|\s/g, '')
                                const [x1, y1] = projection(range[0])
                                const [x2, y2] = projection(range[1])
                                const rectAttr = {
                                    x: x1,
                                    y: y1,
                                    height: y2 - y1,
                                    width: x2 - x1,
                                    fill: calcualteTypeColor(d.classify),
                                    stroke: calcualteTypeColor(d.classify),
                                    fillOpacity: .3,
                                    onMouseEnter: () => {
                                        select(`.${cpname}_label`).attr('display', null)
                                    },
                                    onMouseOut: () => {
                                        select(`.${cpname}_label`).attr('display', 'none')
                                    }
                                }
                                const textAttr = {
                                    x: x1 + (x2 - x1) / 2,
                                    y: y1 - 10,
                                    textAnchor: 'middle',
                                    fontSize: '12px',
                                    fontWeight: 'bolder',
                                    display: 'none',
                                    className: `${cpname}_label`,
                                    TextEvent: 'none',
                                }

                                const gAttr = {
                                    key: `store-${name}`,
                                }
                                return (
                                    <g {...gAttr}>
                                        <rect {...rectAttr} />
                                        <text {...textAttr}>{name}</text>
                                    </g>
                                )
                            })}
                        </g>
                    </g>
                </svg>
                <div className="carlist">
                    <table>
                        <thead>
                            <th>Color</th>
                            <th>CarID</th>
                            <th>Staff</th>
                        </thead>
                        <tbody>
                            {
                                carArr.map(d => (
                                    <tr
                                        key={d.id}
                                        className={`${selectCar.includes(d.id) ? 'active' : 0}`}
                                        onClick={() => {
                                            const newSelectCar = pushOrPop(selectCar, d.id)
                                            setSelectCard(newSelectCar)
                                        }}
                                    >
                                        <td><div className='color-legend' style={{
                                            background: colorScale(d.id)
                                        }}/></td>
                                        <td>{d.id}</td>
                                        <td>{d.name}</td>
                                    </tr>
                                ))
                            }
                        </tbody>
                    </table>
                </div>
            </div>
            <div className='second'>
                <SplitTrack
                    GasData={allTrack.filter(d => selectCar.includes(d.id))}
                    selectDay = {selectDay}
                    selectDayCB = {d => {setSelectDay(d)}}
                    brushCB = {hourArr => setSelectHour(hourArr.map(d => calHourTime(d)))}
                    playCB = {play}
                />
                {/* <FirstQ /> */}
            </div>
        </div>
    )
}


function SplitTrack({ 
    GasData, selectDay, selectDayCB,
    brushCB,
    playCB,
 }) {
    const [width, height] = [1000, 500]
    const [top, right, bottom, left] = [20,100,20,20]
    const realHeight = height - top - bottom
    const realWidth = width - left - right

    const topRef = useRef(null)
    const bottomRef = useRef(null)
    const brushRef = useRef(null)

    const xScale = scaleTime()
        .domain([new Date('2020-01-01 00:00:00'), new Date('2020-01-01 23:59:59')])
        .range([0, realWidth])
        
    const topAxis = axisTop().scale(xScale)
    const bottomAxis = axisBottom().scale(xScale)

    useEffect(() => {
        select(topRef.current).call(topAxis)
        select(bottomRef.current).call(bottomAxis)
        select(brushRef.current).call(
            brushX()
            .extent([[0,0], [realWidth, realHeight]])
            .on('end', () => {
                const { selection } = event
                if (selection) {
                    const timeArr = selection.map(d => xScale.invert(d)).map(d => moment(d).format('HH:mm:ss'))
                    brushCB(timeArr)
                    console.log(timeArr)
                } else {
                    brushCB(['00:00:00', '23:59:59'])
                }
            })
        )
    }, [])

    const axisPosScale = scalePoint()
        .domain(dayStr)
        .range([realHeight / dayStr.length, realHeight])
        .align(1)

    const gpsArr = useMemo(() => {
        // console.log(GasData)
       const result = chain(GasData)
        .cloneDeep()
        .forEach(trackItem => {
            const { data, stopArr } = trackItem
            trackItem.day = chain(dayStr)
                .reduce((obj, day) => {
                    obj[day] = {
                        track: data.filter(d => d.Timestamp.split(' ')[0] === day),
                        stopDot: stopArr.filter(d => d.st.split(' ')[0] === day),
                    }
                    return obj
                }, {})
                .value()
        })
        .value()
        // console.log(result[0].day['01/09/2014'])
        return result
    }, [GasData])

    const gap = axisPosScale.step()

    const xItem = useMemo(() => {
        return scalePoint()
            .domain(GasData.map(d => d.id))
            .range([0, gap])
            .align(0)
    }, [GasData])

    return (
        <div className='explain'>
            <div className='toolbox'>
                <button onClick={() => {
                    playCB()
                    select('.scaleplate')
                        .attr("x1", 0)
                        .attr("x2", 0)
                        .transition()
                        .ease(easeLinear)
                        .attr("x1", realWidth)
                        .attr("x2", realWidth)
                        .duration(10000)
                    select('.scaleplate')
                        .transition()
                        .attr("x1", 0)
                        .attr("x2", 0)
                        .delay(10000)

                }}>
                    play
                </button>
                <input type='checkbox' id='checkall' onChange={e => {
                    const val = e.target.checked
                    if (val) {
                        selectDayCB(dayStr)
                    } else {
                        selectDayCB([])
                    }

                }}/>
                <label htmlFor="checkall">全选</label>
            </div>
            <svg width={width} height={height} className='timeScale'>
                <g className="bg" transform={`translate(${left}, ${top})`}>
                    {/* 坐标 */}
                    <g ref={topRef} />
                    <g ref={bottomRef} transform={`translate(0, ${realHeight})`}  />
                    {/* time split */}
                    <line className='scaleplate' x1={0} y1={0} x2={0} y2={realHeight} />
                    {/* brush */}
                    <g className="brush" ref={brushRef} />
                    {/* day */}
                    {dayStr.map(d => {
                        const className = selectDay.includes(d) ? '' : 'disabled'
                        return (
                            <g transform={`translate(${0}, ${axisPosScale(d)})`} className={`dayItem ${className}`} key={d}>
                                <line  x1={0} y1={0} x2={realWidth} y2={0}/>
                                <text onClick={() => {
                                    const newDay = pushOrPop(selectDay, d)
                                    selectDayCB(d)
                                }} transform={`translate(${realWidth + 10}, ${-gap / 2})`}>{d}</text>
                            </g>
                        )
                    })}
                    {/* gps */}
                    {
                        gpsArr.map((carItem, index) => {
                            const { day, id } = carItem
                            return Object.entries(day)
                                .map(dayitem => {
                                    const [dayName, data] = dayitem
                                    const { stopDot } = data
                                    const pathFun = path()
                                    
                                    stopDot.forEach((d, i) => {
                                        const x1 = xScale(new Date(`2020-01-01 ${d.st.split(' ')[1]}`))
                                        const x2 = xScale(new Date(`2020-01-01 ${d.et.split(' ')[1]}`))
                                        if (i === 0) pathFun.moveTo(x1, 0)
                                        pathFun.lineTo(x1, 0)
                                        pathFun.lineTo(x1, -10)
                                        if (d.et.split(' ')[0] === dayName) {
                                            pathFun.lineTo(x2, -10)
                                            pathFun.lineTo(x2, -0)
                                        }
                                    })
                                    console.log(xItem(id))
                                    const y2 = gap / (gpsArr.length + 1) * (index + 1)
                                    return (
                                        <g transform={`translate(${0}, ${axisPosScale(dayName) - gap + y2})`} key={`${dayName}-${id}`}>
                                                {
                                                    stopDot.map(stopItem => {
                                                        const location = findLocaiton([stopItem.long, stopItem.lat])
                                                        const sx = xScale(new Date(`2020-01-01 ${stopItem.st.split(' ')[1]}`))
                                                        let ex = xScale(new Date(`2020-01-01 ${stopItem.et.split(' ')[1]}`))
                                                        if(ex < sx) ex = xScale(new Date(`2020-01-01 23:59:59`))
                                                        
                                                        const locationType = location ? storeMapType[location] : 'location'

                                                        const rectAttr = {
                                                            x1: 0,
                                                            y1: 0,
                                                            x2: ex-sx,
                                                            y2: 0,
                                                            // width: ex-sx,
                                                            strokeWidth: 2,
                                                            fill: calcualteTypeColor(locationType),
                                                            stroke: calcualteTypeColor(locationType),
                                                            className: 'stopItem',
                                                            fillOpacity: .2,
                                                            rx: 5,
                                                            ry: 5,
                                                        }
                                                        const textAttr = {
                                                            fontSize: 6,
                                                            x: (ex-sx)/2,
                                                            y: -6,
                                                            textAnchor: 'middle',
                                                            className: 'stopItemLabel'
                                                        }
                                                        return (
                                                            <g transform={`translate(${sx}, ${0})`}  key={`${dayName}-${id}-${sx}`}>
                                                                <text {...textAttr}>{location ? location.split(' ').map(d => d[0]).join('-') : ''}</text>
                                                                <line {...rectAttr}>
                                                                    <title>
                                                                        {
                                                                            `时间: ${stopItem.st.split(' ')[1]}--${stopItem.et.split(' ')[1]}\n地点: ${location}\n汽车: ${id}\n消费: ...`
                                                                        }
                                                                    </title>
                                                                </line>
                                                            </g>
                                                        )
                                                    })
                                                }
                                        </g>
                                    )
                                })
                        })
                    }
                </g>
            </svg>
        </div>
    )
}