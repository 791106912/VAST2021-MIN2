import { ascending } from 'd3-array'
import { csv, json } from 'd3-fetch'
import { geoAlbers, geoPath } from 'd3-geo'
import { scaleOrdinal } from 'd3-scale'
import { line, schemeCategory10 } from 'd3'
import { select } from 'd3-selection'
import { chain } from 'lodash'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import './index.scss'

export default function SecondQ() {
    const [ width, height ] = [1000, 800]
    const mapRef = useRef(null)
    const trackRef = useRef(null)

    const [map, setmap] = useState([])
    const [allTrack, setAllTrack] = useState([])

    const projection = useMemo(() => geoAlbers(), [])
    const colorScale = useMemo(() => 
        scaleOrdinal()
            .domain(allTrack.map(d => d.id))
            .range(schemeCategory10)
    ,[allTrack])

    useEffect(() => {
        json('./data/map.json').then(res => {
            projection.fitSize([width + 100, height + 60], res)
            setmap(res.features)
        })
        csv('./data/gps.csv').then(res => {
            const carGeo = chain(res)
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
                .value()
            setAllTrack(carGeo)
        })
    }, [])
    return (
        <div className='second-graph'>
            <img src='./data/bg.jpeg' className='realMap' alt='map' />
            <svg height={height} width={width}>
                <g className="bg">
                    <g className="map" ref={mapRef}>
                        {map.map((d, i) => (
                            <path key={i} className='map-item' d={geoPath(projection)(d)}/>
                        ))}
                    </g>
                    {/* <g className="track" ref={trackRef}>
                        {allTrack.map(d => {
                            const { id, data } = d
                            const geoArr = data.map(d1 => projection([d1.long, d1.lat]))
                            const attr = {
                                key: id,
                                stroke: colorScale(id),
                                d: line()(geoArr),
                                className: 'trackItem',
                            }
                            return (
                                <path {...attr} />
                            )
                        })}
                    </g> */}
                </g>
            </svg>
        </div>
    )
}
