import React from 'react'
import CarTrack from '../../components/carTrack'
import ConsumerGraph from '../../components/consumerGraph'
import Map3D from '../../components/map'
import UserTable from '../../components/userTable'
import './index.scss'

export default function System() {
    return (
        <div className='system'>
            <div className="top">
                <div className='mapContainer'>
                    <CarTrack />
                </div>
                <div className='tableContainer'>
                    <UserTable /> 
                </div>
            </div>
            <div className="bottom">
                <div className='trackContainer'>
                    {/* <Map3D /> */}
                </div>
                <div className='consumeContainer'>
                    <ConsumerGraph />
                </div>
            </div>
        </div>
    )
}
