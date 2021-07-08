import { observer } from 'mobx-react'
import React, { useMemo } from 'react'
import { car_card_dict } from '../../data/card_car_map'
import { carAssign } from '../../data/consumer_data'
import systemStore from '../../page/system/store'
import { calCarColor } from '../../utils'
import './index.scss'

function UserTable() {
    const { activeCar, changeActiveCar } = systemStore
    const carData = useMemo(() => {
        return Object.keys(car_card_dict)
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
    }, [])
    return (
        <div className="userTable">
            <div className="left">
            {
                carData.slice(0, (carData.length) / 2).map(d => {
                    const color = calCarColor(d.id)
                    const style = activeCar.includes(d.id) ? {
                        background: color,
                        color: '#fff',
                        borderColor: color,
                    } : {
                        background: '#fff',
                        color,
                        borderColor: color,
                    }
                    return (
                        <div
                            className="user-item"
                            title={
                                `Dep: ${d.type} \nTitle: ${d.title}`
                            }
                            key={d.id}
                            onClick={() => {
                                changeActiveCar(d.id)
                            }}
                        >
                            <div className="user-count" style={style}>{d.id}</div>
                            <div className="user-name">{d.name}</div>
                        </div>
                    )
                })
            }
            </div>
            <div className="left">
            {
                carData.slice((carData.length) / 2, carData.length).map(d => {
                    const color = calCarColor(d.id)
                    const style = activeCar.includes(d.id) ? {
                        background: color,
                        color: '#fff',
                        borderColor: color,
                    } : {
                        background: '#fff',
                        color,
                        borderColor: color,
                    }
                    return (
                        <div
                            className="user-item"
                            title={
                                `Dep: ${d.type} \nTitle: ${d.title}`
                            }
                            key={d.id}
                            onClick={() => {
                                changeActiveCar(d.id)
                            }}
                        >
                            <div className="user-count" style={style}>{d.id}</div>
                            <div className="user-name">{d.name}</div>
                        </div>
                    )
                })
            }
            </div>
             
            {/* <table border='0'>
                <thead>
                    <tr>
                        <th></th>
                        <th>CarID</th>
                        <th>Name</th>
                        <th>Dep</th>
                        <th>Title</th>
                    </tr>
                </thead>
                <tbody>
                    {
                        carData.map(d => {
                            const color = calCarColor(d.id)
                            return (
                                <tr
                                    key={d.id}
                                    className={`userItem ${activeCar.includes(d.id) ? 'active' : ''}`}
                                    // style={{
                                    //     background: true ? color : null,
                                    // }}
                                    // className={`${selectCar.includes(d.id) ? 'active' : 0}`}
                                    onClick={() => {
                                        changeActiveCar(d.id)
                                    }}
                                >
                                    <td>
                                        <div
                                            className='userLegend'
                                            style={{
                                                background: color
                                            }}
                                        />
                                    </td>
                                    <td>{d.id}</td>
                                    <td>{d.name}</td>
                                    <td>{d.type}</td>
                                    <td>{d.title}</td>
                                </tr>
                            )
                        })
                    }
                </tbody>
            </table> */}
        </div>
    )
}

export default observer(UserTable)