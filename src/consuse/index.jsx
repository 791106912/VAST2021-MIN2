import { extent } from 'd3-array'
import { csv } from 'd3-fetch'
import { scaleLinear } from 'd3-scale'
import { select, selectAll } from 'd3-selection'
import { chain, sumBy } from 'lodash'
import moment from 'moment'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import './index.css'

const timeformate = d => moment(d).format('MM-DD HH')

const aggrePrice = (data) => {
    return data.reduce((num, d) => {
      num = parseFloat((num + Number(d)).toFixed(10))
      return num
    }, 0)
      
}

export default function ConsusePage() {
    
    const [top, right, bottom, left] = [100, 0, 10, 140]
  
    const width = 1400
    
    const heightItem = 30;
    
    const height = heightItem * 34 + top + bottom
    
    const realHeight = height - top - bottom
    const realWidth = width - left - right
    
    const widthItem = realWidth / 24 / 14

    const [size, setsize] = useState({
        width,
        height,
    })

    const chart = useRef(null)

    const contentRef = useRef(null)

    const xScale = useMemo(() => {
        return scaleLinear().range([0, realWidth])
    }, [])

    useEffect(() => {
        const cc  = new Promise(resolve => {
            csv('/data/cc_data.csv').then(res => {
                resolve(res)
            })
        })

        const loy = new Promise(resolve => {
            csv('/data/loyalty_data.csv').then(res => {
                // const data = res.josn()
                resolve(res)
            })
        })
        Promise.all([cc, loy]).then(res => {
            // draw(res)
            calcualteTimeData(res[0])
            calculateLocationData(res[0], res[1])
        })
    }, [])
   
    const [timeDay, settimeDay] = useState([])
    let copyData = []
    const [timeHour, settimeHour] = useState([])

    function calcualteTimeData(ccdata) {
        const [mintime, maxtime] = extent(ccdata, d => moment(d.timestamp))
        const timeExtent = [mintime.startOf('d').unix() * 1000, maxtime.endOf('d').unix() * 1000]
        xScale.domain(timeExtent)
        const newtimeDay = chain(ccdata)
          .map(d => moment(d.timestamp.split(' ')[0]).unix() * 1000)
          .uniq()
          .value()


        const newtimeHour = chain(newtimeDay)
            .map(d => [7, 12, 18].map(d1 => d + d1 * 3600 * 1000))
            .flatten()
            .value()
        
        settimeDay(newtimeDay)
        copyData = newtimeDay
        settimeHour(newtimeHour)
    }
    const [locationData, setlocationData] = useState([])
    function calculateLocationData(ccdata, loydata) {
        const newlocationData = chain(ccdata)
            .map('location')
            .uniq()
            .reduce((obj, location) => {
                const timeDayArr = []
                copyData.forEach(time => {
                    const day = moment(time).format('MM/DD/YYYY')
                    const thisccdata = ccdata.filter(d => d.location === location && d.timestamp.split(' ')[0] === day)
                    const thisloydata = loydata.filter(d => d.location === location && d.timestamp === day)
                    const timeHourPrice =  chain(thisccdata)
                    .reduce((obj,d) => {
                        const key = moment(d.timestamp).startOf('h').unix() * 1000
                        const value = obj[key] ? parseFloat((obj[key].value + Number(d.price)).toFixed(10)) : Number(d.price)
                        obj[key] = {
                        time: key,
                        name: timeformate(key),
                        value,
                        }
                        return obj
                    }, {})
                    .values()
                    .sortBy('time')
                    .value()
                
                    const timeHourPeople =  chain(thisccdata)
                    .reduce((obj,d) => {
                        const key = moment(d.timestamp).startOf('h').unix() * 1000
                        const value = obj[key] ? obj[key].value + 1 : 1
                        obj[key] = {
                            time: key,
                            name: timeformate(key),
                            value,
                        }
                        return obj
                        }, {})
                        .values()
                        .value()
                    timeDayArr.push({
                        time,
                        name: day,
                        ccdata: thisccdata,
                        cccount: chain(thisccdata).map('last4ccnum').uniq().value().length,
                        dayCCPrice: thisccdata.reduce((count, d) => {
                            count =  parseFloat((count + Number(d.price)).toFixed(10))
                            return count
                        }, 0),
                        loydata: thisloydata,
                        loycount: chain(thisloydata).map('loyaltynum').uniq().value().length,
                        dayLoyPrice: thisloydata.reduce((count, d) => {
                            count =  parseFloat((count + Number(d.price)).toFixed(10))
                            return count
                        }, 0),
                        timeHourPeople,
                        timeHourPrice,
                    })
                })
                obj[location] = {
                    name: location,
                    timeDayArr,
                    peopleCount: sumBy(timeDayArr, 'cccount'),
                }
                return obj
            }, {})
            .values()
            .orderBy('peopleCount', 'desc')
            .value()
        setlocationData(newlocationData)
    }

    function draw(res) {
        const [ccdata, loydata] = res

        const aggrelocation = chain(ccdata)
                .map('location')
                 .uniq()
                 .reduce((obj, d) => {
                  const thisccdata = ccdata.filter(d1 => d1.location === d)
                  const thisloydata = loydata.filter(d1 => d1.location === d)
                  
                  const timeCountChart = chain(thisccdata)
                    .reduce((obj,d) => {
                      const key = moment(d.timestamp).startOf('h').unix() * 1000
                      const value = obj[key] ? parseFloat((obj[key].value + Number(d.price)).toFixed(10)) : Number(d.price)
                      obj[key] = {
                        time: key,
                        name: timeformate(key),
                        value,
                      }
                      return obj
                    }, {})
                    .values()
                    .sortBy('time')
                    .value()
                  
                  const peopleCountChart = chain(thisccdata)
                    .reduce((obj,d) => {
                      const key = moment(d.timestamp).startOf('h').unix() * 1000
                      const value = obj[key] ? obj[key].value + 1 : 1
                      obj[key] = {
                        time: key,
                        name: timeformate(key),
                        value,
                      }
                      return obj
                    }, {})
                    .values()
                    .sortBy('time')
                    .value()
                  
                   const dayCCPrice = chain(thisccdata)
                    .reduce((obj,d) => {
                      const key = moment(d.timestamp).startOf('d').unix() * 1000
                      const value = obj[key] ? parseFloat((obj[key].value + Number(d.price)).toFixed(10)) : Number(d.price)
                      obj[key] = {
                        time: key,
                        name: timeformate(key),
                        value,
                      }
                      return obj
                    }, {})
                    .values()
                    .sortBy('time')
                    .value()
                   const dayLoyPrice = chain(thisloydata)
                    .reduce((obj,d) => {
                      const key = moment(d.timestamp).startOf('d').unix() * 1000
                      const value = obj[key] ? parseFloat((obj[key].value + Number(d.price)).toFixed(10)) : Number(d.price)
                      obj[key] = {
                        time: key,
                        name: timeformate(key),
                        value,
                      }
                      return obj
                    }, {})
                    .values()
                    .sortBy('time')
                    .value()
                  obj[d] = {
                    name: d,
                    ccprice:  aggrePrice(thisccdata.map(d => Number(d.price))),
                    cccount: chain(thisccdata).map('last4ccnum').uniq().value().length,
                    ccdata: thisccdata,
                    timeData: timeCountChart,
                    peopleData: peopleCountChart,
                    peopleCount: sumBy(peopleCountChart, 'value'),
                    dayCCPrice,
                    dayLoyPrice,
                    loydata: thisloydata,
                    loyprice: aggrePrice(thisloydata.map(d => Number(d.price))),
                    loycount: chain(thisloydata).map('loyaltynum').uniq().value().length,
                  }
                  return obj
                }, {})
                .values()
                .orderBy('peopleCount', 'desc')
                 .value()

        
        const content = select(contentRef.current)
            
        

        const priceCountChart = chain(ccdata)
          .reduce((obj,d) => {
            const key = `${d.location}-${moment(d.timestamp).startOf('h').unix()}`
            const value = obj[key] ? parseFloat((obj[key].value + Number(d.price)).toFixed(10)) : Number(d.price)
            obj[key] = {
              time: key,
              location: d.location,
              value,
            }
            return obj
          }, {})
          .values()
          .value()
        const valueExtent = extent(priceCountChart, d => d.value)

        // 每小时消费比例尺
        const heightPriceScale = scaleLinear()
          .domain(valueExtent)
          .range([3, heightItem])


        const people = chain(ccdata)
                .reduce((obj,d) => {
                const key = `${d.location}-${moment(d.timestamp).startOf('h').unix()}`
                const value = obj[key] ? obj[key].value + 1  : 1
                obj[key] = {
                    time: key,
                    location: d.location,
                    value,
                }
                return obj
                }, {})
                .values()
                .value()
        const peopleExtent = extent(people, d => d.value)
        
        // 每小时人流量比例尺
        const heightPeopleScale = scaleLinear()
          .domain(peopleExtent)
          .range([3, heightItem])
        

        const dayPriceExtent = extent(
            chain(aggrelocation)
              .map(d => [d.dayCCPrice, d.dayLoyPrice])
              .flattenDeep()
              .value(),
            d => d.value
          )
        
        const priceDayScale = scaleLinear()
            .domain([0, dayPriceExtent[1]])
            .range([0, widthItem * 24])
        
         const priceDayOpacityScale = scaleLinear()
            .domain(dayPriceExtent)
            .range([0.1, 0.8])
         // console.log(locationData)




        
        // const locationDayItem = locationItem.append('g')
        //   .classed('locationDay', true)
        //   .selectAll('g.locationDayItem')
        //   .data(d => d.timeDayArr)
        //   .join('g')
        //   .classed('locationDayItem', true)
        //   .on('click', function(e,d){
        //     selectAll('.selected').classed('selected', false)
        //     select(this).attr('class', 'locationDayItem selected')
        //     console.log(d)
        //     const selectData = [
        //       {
        //         label: '时间',
        //         value: d.name, 
        //       },
        //        {
        //         label: '地点',
        //         value: d.ccdata[0] ? d.ccdata[0].location : d.loydata[0].location, 
        //       },
        //       {
        //         label: '信用卡金额',
        //         value: d.dayCCPrice, 
        //       },
        //       {
        //         label: '信用卡消费记录',
        //         value:d.ccdata.map(d1 => ({
        //           时间: d1.timestamp,
        //           金额: d1.price,
        //           卡号: d1.last4ccnum,
        //         })), 
        //       },
        //       {
        //         label: '会员卡金额',
        //         value: d.dayLoyPrice, 
        //       },
        //       {
        //         label: '会员卡消费记录',
        //         value: d.loydata.map(d1 => ({
        //           时间: d1.timestamp,
        //           金额: d1.price,
        //           卡号: d1.loyaltynum,
        //         })), 
        //       },
        //     ]
        //     //   tooltip
        //     //     .html(
        //     //       selectData.map(d => {
        //     //         return typeof d.value !== 'object'
        //     //             ? `<div><span>${d.label}</span>: <span>${d.value}</span></div>`
        //     //             :  `<div><div>${d.label}: </div> <div>${d.value.map(d1 => `<div>${JSON.stringify(d1)}</div>`).join('')}</div></div>`
        //     //       }).join('')
        //     //     )
        //     //     .style('visibility', 'visible')
        //     //     .style('top', e.pageY + 10 + 'px')
        //     //     .style('left', e.pageX + 10 + 'px');
        //   })
        //   .attr('transform', d => `translate(${xScale(d.time)}, 0)`)
          
        
        // locationDayItem.selectAll('rect.dayTotal')
        //   .data(d => {
        //       const { dayCCPrice, dayLoyPrice } = d
        //        const maxValue = Math.max(dayCCPrice, dayLoyPrice)
        //        const itemScale = scaleLinear()
        //          .domain([0, maxValue || 1])
        //          .range([0, widthItem * 24])
        //        return [dayCCPrice, dayLoyPrice].map(d => ({
        //           value: d,
        //           width: itemScale(d),
        //        }))
        //   })
        //   .join('rect')
        //   .classed('dayTotal', true)
        //   .attr('x', 0)
        //   .attr('y', (d, i) => i ? heightItem / 2 : 0)
        //   .attr('width', d => d.width)
        // // .attr('width', d =>priceDayScale(d.value))
        //   .attr('height', heightItem / 2)
        //   .attr('fill', (d, i) => i ? 'green' : 'blue')
        //   .attr('fill-opacity',  d => priceDayOpacityScale(d.value))
        
        // locationDayItem
        //   .append('g')
        //   .classed('detail', true)
        //   .selectAll('rect')
        //   .data(d => {
        //     // return d.timeHourPrice
        //     return d.timeHourPeople
        //   })
        //   .join('rect')
        //   .attr('x', d => xScale(d.time) - xScale(moment(d.time).startOf('d').unix() * 1000))
        //   .attr('width', widthItem - 2)
        //   // .attr('y', d => (heightItem - heightPriceScale(d.value)) / 2 )
        //   // .attr('height', d => heightPriceScale(d.value))
        //   .attr('y', d => (heightItem - heightPeopleScale(d.value)) / 2 )
        //   .attr('height', d => heightPeopleScale(d.value))
        //   .attr('fill', 'red')
    }
    return (
        <div>
            <svg ref={chart} width={size.width}  height={size.height}>
                <g className='content' transform={`translate(${left}, ${top})`} ref={contentRef}>
                    <g className="timeContent">
                        {
                            timeDay.map(d => {
                                const x = xScale(d)
                                return (
                                    <g className="daySplit" key={d}>
                                        <line x1={x} x2={x} y1={0} y2={realHeight} />
                                        <text transform={`translate(${xScale(d) + widthItem * 12}, -20)`}>{moment(d).format('MM-DD')}</text>
                                    </g>
                                )
                            })
                        }
                        {
                            timeHour.map(d => {
                                const x = xScale(d)
                                return (
                                    <g className="hourSplit" key={d}>
                                        <line x1={x} x2={x} y1={0} y2={realHeight} />
                                        <text transform={`translate(${xScale(d)}, -10)`}>{moment(d).format('HH')}</text>
                                    </g>
                                )
                            })
                        }
                    </g>
                    <g className="location-bg">
                        {
                            locationData.map((d, i) => {
                                return (
                                    <g className="locationItem" transform={`translate(${0}, ${heightItem * i})`}>
                                        <text>{d.name}</text>
                                        <line x1={0} y1={heightItem} x2={realWidth} y2={heightItem} />
                                        <g className="locationDay">
                                            {
                                                d.timeDayArr.map(d1 => {
                                                    console.log(d1)
                                                    const { dayCCPrice, dayLoyPrice } = d1
                                                    const maxValue = Math.max(dayCCPrice, dayLoyPrice)
                                                    const itemScale = scaleLinear()
                                                        .domain([0, maxValue || 1])
                                                        .range([0, widthItem * 24])
                                                    const dayData = [dayCCPrice, dayLoyPrice].map(d3 => ({
                                                        value: d3,
                                                        width: itemScale(d3),
                                                     }))
                                                    return (
                                                        <g className='locationDayItem' transform={`translate(${xScale(d1.time)}, 0)`}>
                                                            {
                                                                dayData.map((d2, j) => {
                                                                    return (
                                                                        <rect className="dayTotal"
                                                                            x={0}
                                                                            y={j ? heightItem / 2 : 0}
                                                                            width={d.width}
                                                                            height={heightItem / 2}
                                                                            fill={j ? 'green' : 'blue'}
                                                                            fillOpacity={1}
                                                                        />
                                                                    )
                                                                })
                                                            }
                                                        </g>
                                                    )
                                                })
                                            }
                                        </g>
                                    </g>
                                )
                            })
                        }
                    </g>
                </g>
                </svg>
        </div>
    )
}
