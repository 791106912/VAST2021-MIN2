import React from 'react'
import { car_card_dict } from '../../data/card_car_map'
import { carAssign } from '../../data/consumer_data'
import { calCarColor } from '../../utils'
import './index.scss'

export default function UserTable() {
    const carData = Object.keys(car_card_dict)
        .map(d => {
            console.log(d)
            const info = carAssign.find(d1 => d1.CarID === d)
            console.log(info)
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
    return (
        <div className="userTable">
            <table border='0'>
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
                                    className={`userItem`}
                                    // style={{
                                    //     background: true ? color : null,
                                    // }}
                                    // className={`${selectCar.includes(d.id) ? 'active' : 0}`}
                                    // onClick={() => {
                                    //     const newSelectCar = pushOrPop(selectCar, d.id)
                                    //     setSelectCard(newSelectCar)
                                    // }}
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
            </table>
        </div>
    )
}
