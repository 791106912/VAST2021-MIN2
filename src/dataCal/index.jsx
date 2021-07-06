import { json } from 'd3-fetch'
import { chain, countBy, max } from 'lodash'
import React, { useEffect, useRef } from 'react'
import './index.scss'
import moment from 'moment'
import { forceCenter, forceLink, forceManyBody, forceSimulation } from 'd3-force'
import { select } from 'd3-selection'
import CarTrack from '../components/carTrackOrigin'
import { findLocaiton, findLocationCoord } from '../utils'
import { card_car_dict, car_card_dict } from '../data/card_car_map'


export default function Cal() {

    function calNode() {
        return json('./data/gpswithstop.json').then(res => {
            console.log(res)
            const nodeData = res.map(d => ({
                id: d.id,
                data: d.stopArr.map(d1 => ({
                    ...d1,
                    location: findLocaiton([d1.long, d1.lat]),
                })),
            }))
            console.log(nodeData)
            const linksObj = {}
            nodeData.forEach((d1) => {
                nodeData.forEach(d2 => {
                    if (d1.id === d2.id) return
                    if (linksObj[`${d1.id}-${d2.id}`] || linksObj[`${d2.id}-${d1.id}`]) return
                    // const sameLoaction = intersection(d1.location, d2.location)
                    const sameLoaction = d1.data
                        .filter(d3 => {
                            if (!d3.location) return false
                            const st1 = moment(d3.st).unix()
                            const et1 = moment(d3.et).unix()
                            const a = d2.data.filter(d4 => {
                                const st2 = moment(d4.st).unix()
                                const et2 = moment(d4.et).unix()
                                // return (st1 < et2 && et1 > st2 ) && d3.location === d4.location
                                return Math.abs(st1 - st2) < 3600 && d3.location === d4.location
                            })
                            return a.length
                        })
                    // const sameLoaction = []
                    linksObj[`${d1.id}-${d2.id}`] = {
                        source: d1.id,
                        target: d2.id,
                        d1: d1.id,
                        d2: d2.id,
                        value: sameLoaction.length,
                        data: countBy(sameLoaction, 'location')
                    }
                })
            })
            const nodes = nodeData
            const links = chain(linksObj).values().filter(d => d.value > 10).value()

            console.log(chain(linksObj).values().orderBy('value', 'desc')
            .map(d => ({
                sourceId: d.d1,
                targetId: d.d2,
                value: d.value,
                data: d.data,
            })).value()
            )

            console.log(linksObj)
            return [nodes, links]
        })
        // carAssign.reduce(d => {
            
        // })
    }
    const svgRef = useRef(null)

    const [width, height] = [1000,600]
    const [top, right, bottom, left] = [40, 20, 20, 60]

    // useEffect(() => {
    //     json('./data/merge_cc_and_loy.json').then(res => {
    //         console.log(res)
    //         // 
    //         // {消费时间
    //             // 消费id
    //             // （消费信用卡号）
    //             // 消费金额
    //             // 消费商店
    //             // 消费对应车辆停留位置
    //             // }
    //         const cusom = res.map(d => {
    //             return {
    //                 ...d,
    //                 id: card_car_dict[d.loyaltynum] || false,
    //                 coor: findLocationCoord(d.location),
    //             }
    //         })
    //         console.log(JSON.stringify(cusom))
    //     })
    // }, [])
 
    useEffect(() => {
        // calNode()
        // .then(res => {
        //     const [nodes, links] = res
        //     console.log(nodes, links)
        //     const value = max(links, d => d.value)
        //     // console.log(value)
        //     // console.log(links)
        //     const force = forceSimulation(nodes)
        //         .force('links', forceLink(links)
        //             .id(d => d.id)
        //             // .strength(d => 0.01 * d.value)
        //             .distance(100)
        //         )
        //         .force('charge', forceManyBody())
        //         .force('center', forceCenter(width / 2, height / 2))
        //     const svg = select(svgRef.current)
        //     const link = svg.append('g')
        //         .selectAll('g')
        //         .data(links)
        //         .enter()
        //         .append('line')
        //         // .attr("stroke-width", d => d.value)
        //         .attr("stroke-width", d => 1)
        //         .attr("stroke", '#e9e9e9');
            
        //     const node = svg.append('g')
        //         .selectAll('g')
        //         .data(nodes)
        //         .enter()
        //         .append('circle')
        //         .attr('r', 5)
        //         .attr('fill', 'red')
            
        //     force.on('tick', () => {
        //         link
        //             .attr("x1", d => d.source.x)
        //             .attr("y1", d => d.source.y)
        //             .attr("x2", d => d.target.x)
        //             .attr("y2", d => d.target.y);

        //         node
        //             .attr("cx", d => d.x)
        //             .attr("cy", d => d.y);
        //     })
        // })
    }, [])
    return (
        <div>
            <CarTrack />
            <svg ref={svgRef}/>
        </div>
    )
}
