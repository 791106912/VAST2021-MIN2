import { csv } from 'd3-fetch'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { building_coordinate } from '../../data/buliding_coordinate'
import consumptionDots from '../../data/consumptionDots'
import road from '../../data/abila_maps'
import './index.scss'
import { observer } from 'mobx-react'
import systemStore from '../../page/system/store'
import { chain, maxBy } from 'lodash'
import { dayStr } from '../../data/consumer_data'
import { calCarColor, calcualteStoreColor, findLocationCoord } from '../../utils'
import { scaleLinear } from 'd3-scale'
import moment from 'moment'
import { car_card_dict } from '../../data/card_car_map'
import { deviation, mean } from 'd3-array'

const fatLineWidth = 4, OverlapLineWidth = 8 // in pixels
let trajectoryInfo
let timeToplimit = 1800000
let timeButtomlimit = 30000
const buildingR = 0.00025
let stats = null

const { maptalks, Stats, THREE,
    getLinePosition,
    _getLinePosition,
    MeshLine,
    MeshLineMaterial,dat,THREE_Text2D } = window



var OPTIONS = {
    altitude: 0,
    speed: 0.001
}

let run = null

function getConsumptionDotMaterial(num, color) {
    let name = num > 1.5 ? "cricle_outlier" : "circle"
    let material = new THREE.PointsMaterial({
        size: 20,
        sizeAttenuation: false,
        color: color,
        transparent: false,
        blending: THREE.AdditiveBlending,
        depthTest: false, //深度测试关闭，不消去场景的不可见面
        depthWrite: false,
        map: new THREE.TextureLoader().load('./data/icon/' + name + '.png')
    })
    return material
}


//ringEffect////////////////////////////////////////////////////////////////////
class RingEffect extends maptalks.BaseObject {
    constructor(coordinate, options, material, layer) {
        options = maptalks.Util.extend({}, OPTIONS, options, {
            layer,
            coordinate
        })
        super()
        //Initialize internal configuration
        this._initOptions(options)
        const {
            altitude,
            radius
        } = options
        //generate geometry
        const r = layer.distanceToVector3(radius, radius).x
        const geometry = new THREE.RingBufferGeometry(0.001, r, 20, 5, 0, Math.PI * 2)

        //Initialize internal object3d
        this._createGroup()
        const mesh = new THREE.Mesh(geometry, material)
        this.getObject3d().add(mesh)
        //set object3d position
        const z = layer.distanceToVector3(altitude, altitude).x
        const position = layer.coordinateToVector3(coordinate, z)
        this.getObject3d().position
            .copy(position)
    }

    _animation() {
        const ring = this.getObject3d().children[0]
        const speed = this.getOptions().speed
        ring.material.uniforms.time.value += speed + 50
    }
}


var simplepath = {

    positionsConvert: function (worldPoints, altitude = 0, layer) {
        const vectors = [];
        for (let i = 0, len = worldPoints.length; i < len; i += 3) {
            let x = worldPoints[i], y = worldPoints[i + 1], z = worldPoints[i + 2];
            if (altitude > 0) {
                z += layer.distanceToVector3(altitude, altitude).x;
            }
            vectors.push(new THREE.Vector3(x, y, z));
        }
        return vectors;
    },

    vectors2Pixel: function (worldPoints, size, camera, altitude = 0, layer) {
        if (!(worldPoints[0] instanceof THREE.Vector3)) {
            worldPoints = simplepath.positionsConvert(worldPoints, altitude, layer);
        }
        const pixels = worldPoints.map(worldPoint => {
            return simplepath.vector2Pixel(worldPoint, size, camera);
        })
        return pixels;

    },

    vector2Pixel: function (world_vector, size, camera) {
        const vector = world_vector.project(camera);
        const halfWidth = size.width / 2;
        const halfHeight = size.height / 2;
        const result = {
            x: Math.round(vector.x * halfWidth + halfWidth),
            y: Math.round(-vector.y * halfHeight + halfHeight)
        };
        return result;
    },

};

var OPTIONS1 = {
    fontSize: 20,
    altitude: 0,
    color: '#fff',
    text: 'hello',
    weight: 0,
    zoomFilter: false
};
class TextSprite extends maptalks.BaseObject {
    constructor(coordinate, options, layer) {
        options = maptalks.Util.extend({}, OPTIONS1, options, { layer, coordinate });
        super();
        //Initialize internal configuration
        // https://github.com/maptalks/maptalks.three/blob/1e45f5238f500225ada1deb09b8bab18c1b52cf2/src/BaseObject.js#L135
        this._initOptions(options);
        const { altitude, fontSize, color, text } = options;


        //Initialize internal object3d
        // https://github.com/maptalks/maptalks.three/blob/1e45f5238f500225ada1deb09b8bab18c1b52cf2/src/BaseObject.js#L140
        this._createGroup();
        const textsprite = new THREE_Text2D.SpriteText2D(text, { align: THREE_Text2D.textAlign.center, font: `${fontSize * 2}px Arial`, fillStyle: color, antialias: false });
        textsprite.children[0].material.sizeAttenuation = false;
        const scale = 0.01 / 10 / 3;
        textsprite.scale.set(scale, scale, scale);
        this.getObject3d().add(textsprite);

        //set object3d position
        const z = layer.distanceToVector3(altitude, altitude).x;
        const position = layer.coordinateToVector3(coordinate, z);
        this.getObject3d().position.copy(position);
        this.textRect = {
            width: this.calTextWidth(text, fontSize),
            height: fontSize
        }

        this._vector = new THREE.Vector3();
        this._pixel = {
            x: 0,
            y: 0
        };
    }

    getTextRect() {
        this.getPixel();
        const { x, y } = this._pixel;
        const { width, height } = this.textRect;
        return {
            minX: x - width / 2,
            minY: y - height / 2,
            maxX: x + width / 2,
            maxY: y + height / 2
        }
    }

    calTextWidth(text, fontSize) {
        const chinese = text.match(/[\u4e00-\u9fa5]/g) || '';
        const chineseLen = chinese.length;
        const width = chineseLen * fontSize + (text.length - chineseLen) * 0.5 * fontSize;
        return width;
    }

    getPixel() {
        const size = this.getMap().getSize();
        const camera = this.getLayer().getCamera();
        const position = this.getObject3d().position;
        this._vector.x = position.x;
        this._vector.y = position.y;
        this._vector.z = position.z;
        this._pixel = simplepath.vector2Pixel(this._vector, size, camera);
    }

    identify(coordinate) {
        const { minX, minY, maxX, maxY } = this.getTextRect();
        const pixel = this.getMap().coordToContainerPoint(coordinate);
        if (pixel.x >= minX && pixel.x <= maxX && pixel.y >= minY && pixel.y <= maxY) {
            return true;
        }
        return false;
    }
}

maptalks.ThreeLayer.prototype.toText = function (coordinate, options) {
    return new TextSprite(coordinate, options, this);
}


function createMaterial(color, variety) {
    return new THREE.PointsMaterial({
        // size: 10,
        sizeAttenuation: false,
        color: color,
        size: 40,
        transparent: false,
        blending: THREE.AdditiveBlending,
        depthTest: false, //深度测试关闭，不消去场景的不可见面
        depthWrite: false,
        map: new THREE.TextureLoader().load('./data/icon/' + variety + '.svg')
    });
}
//FatLines////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//https://threejs.org/examples/#webgl_lines_fat
var fatLinesmaterial = new THREE.LineMaterial({
    color: 0xa7b4d4,
    transparent: true,
    linewidth: fatLineWidth,
    opacity: 0.4
})

var highlightFatLinesmaterial = new THREE.LineMaterial({
    linewidth: fatLineWidth,
    color: 'yellow',
    dashSize: 0.1,
    gapSize: 0.1,
    dashed: true,
    opacity: 0.4
})
highlightFatLinesmaterial.defines.USE_DASH = ''

const threeLayer = new maptalks.ThreeLayer('t', {
    forceRenderOnMoving: true,
    forceRenderOnRotating: true
})

const carInfo = Object.keys(car_card_dict).map(id => {
        const color = calCarColor(id)
        return {
            "id": id,
            "color": color,
            "carIconMaterial": createMaterial(color, "car")
        }
    })

let exitTrack = []

let exitBuild = []

let exitCar2DTrack = []

let already = false

let exitConsumeDot = []

function Map3D() {

    const { activeCar, resetCar, selectDay, changeSelectDay } = systemStore

    const [map, setmap] = useState(null)


    useEffect(() => {
        // document.getElementById('map').innerHTML = ''
        const newmap = new maptalks.Map(
                "map", {
                    center: [24.870, 36.071],
                    zoom: 15,
                    pitch: 70,
                    bearing: 0,
                    view: {
                        projection: "baidu",
                    },
                    attribution: false,
                    doubleClickZoom: false,
                }
            )
        setmap(newmap)

        csv("./data/gps.csv", function (data) {
            return {
                "id": parseInt(data.id),
                "location": [parseFloat(data.long), parseFloat(data.lat)],
                "time": new Date(data.Timestamp),
                dayStr: data.Timestamp.split(' ')[0],
            }
        }).then(function (d) {
            trajectoryInfo = d
            threeLayer.prepareToDraw = function (gl, scene, camera) {
                stats = new Stats()
                stats.domElement.style.zIndex = 100
                document.getElementById('map').appendChild(stats.domElement)
        
                let light = new THREE.AmbientLight(0xffffff, 1)
                scene.add(light)
        
                //地图线
                addLines()
                already = true
                //建筑物
                drawBuildings()
                // 动画
                animation()
            }
            threeLayer.addTo(newmap)
        })
    }, [])

    // !=============================== 开始监听 ===============================
    useEffect(() => {
        if(!already) return
        addOverlapLines(activeCar)
        drawConsumptionDots()
        drawBuildings()
        addTrajectoryLines()
        addRingEffect()
    }, [activeCar, selectDay])

    var selectMesh = []
    var lines = []
    function addLines() {
        //read data
        var lineStrings = maptalks.GeoJSON.toGeometry(road)
        var list = []
        lineStrings.forEach(function (lineString) {
            if (lineString != null) {
                list.push({
                    lineString,
                })
            }
        })
        lineStrings = list.map(l => {
            return l.lineString
        })
        const line = threeLayer.toFatLines(lineStrings, { interactive: false }, fatLinesmaterial)
        line.setToolTip('hello', {
            showTimeout: 0,
            eventsPropagation: true,
            dx: 10
        })

        //event test
        let event = ['click', 'mousemove', 'empty', 'mouseout', 'mouseover', 'mousedown', 'mouseup', 'dblclick', 'contextmenu'].forEach(function (eventType) {
            line.on(eventType, function (e) {
                const select = e.selectMesh
                if (e.type === 'empty' && selectMesh.length) {
                    threeLayer.removeMesh(selectMesh)
                    selectMesh = []
                }

                let data, baseObject

                if (select) {
                    data = select.data
                    baseObject = select.baseObject
                    if (baseObject && !baseObject.isAdd) {
                        baseObject.setSymbol(highlightFatLinesmaterial)
                        threeLayer.addMesh(baseObject)
                        selectMesh.push(baseObject)
                    }
                }
                if (selectMesh.length > 1) {
                    threeLayer.removeMesh(selectMesh)
                    selectMesh = []
                }
                if (e.type === 'mousemove' && data) {
                    const tooltip = this.getToolTip()
                    tooltip._content = `${data.properties.FENAME} ${data.properties.FETYPE}`
                }

                if (e.type === 'click' && data) {
                }

            })
        })

        threeLayer.addMesh(line)
        lines.push(line)
    }

    //Buildings 0705/////////////////////////////////////////////////////////////////////////////////////////////////////////
    const buildConsumeCountObj = useMemo(() => {
        return chain(consumptionDots)
            .filter(d => d.dayStr === selectDay)
            .filter(d => activeCar.length ? activeCar.includes(d.id) : true)
            .countBy('location')
            .value()
    }, [selectDay, activeCar])

    const buildingHeightScale = useMemo(() => {
        const domain = Object.values(buildConsumeCountObj).sort((a,b) => a-b)
        const scale = scaleLinear([0, maxBy(domain)], [100, 400])
        return name => scale(buildConsumeCountObj[name])
    }, [buildConsumeCountObj])

    const activeBuildName = useRef('')
    function drawBuildings() {
        if (!already) return
        const text = []
        if (exitBuild.length > 0) {
            threeLayer.removeMesh(exitBuild)
            exitBuild = []
        }
        building_coordinate.forEach(function (building, num) {
            let centerLong = (building.range[0][0] + building.range[1][0]) / 2
            let centerLat = (building.range[0][1] + building.range[1][1]) / 2
            const heightItem = buildingHeightScale(building.name) || 10
            text.push({
                name: building.name,
                coordinates: [centerLong, centerLat],
                z: heightItem,
            })
            let polygon = new maptalks.Polygon([
                [
                    [centerLong - buildingR, centerLat - buildingR],
                    [centerLong + buildingR, centerLat - buildingR],
                    [centerLong + buildingR, centerLat + buildingR],
                    [centerLong - buildingR, centerLat + buildingR],
                    [centerLong - buildingR, centerLat - buildingR]
                ]
            ])
            let color = calcualteStoreColor(building.name)
            let material = new THREE.MeshPhongMaterial({
                color: color,
                opacity: .5,
                transparent: true
            })
            let extrudePolygon = threeLayer.toExtrudePolygon(polygon, {
                interactive: true,
                height: heightItem,
                topColor: color
            }, material)
            extrudePolygon.id = building.name
            extrudePolygon.on('click', function (e) {
                const select = e.target
                // select.object3d.material.opacity = 1
                const location = select.id
                if (activeBuildName.current === location) {
                    resetCar([])
                    removeRingEffect()
                    return
                }
                activeBuildName.current = location
                const customData = consumptionDots.filter(d => {
                    return d.location === location && d.timestamp.split(' ')[0] === selectDay
                })
                const carId = chain(customData).map('id').uniq().compact().value()
                resetCar(carId)
            })
            exitBuild.push(extrudePolygon)
            threeLayer.addMesh(extrudePolygon)
        })
        const a = text.map(element => {
            const b = threeLayer.toText(element.coordinates, { text: element.name, color:' #000', fontSize: 16, weight: 1, interactive: false })
            b.setAltitude(20 + element.z)
            exitBuild.push(b)
            return b
        });
        threeLayer.addMesh(a);
    }

    //Trajectory Line///////////////////////////////////////////////////////////////////////////////////////////////////


    let trajectoryMeshList = []

    function addTrajectoryLines() {
        trajectoryMeshList = []
        threeLayer.removeMesh(exitCar2DTrack)
        exitCar2DTrack = []
        carInfo
            .forEach(carItem => {
                if (!activeCar.includes(carItem.id)) return
                let TrajectoryList = { "id": carItem.id, "car": carItem }
                let selectedTrajectory = trajectoryInfo
                    .filter(d => d.dayStr === selectDay && d.id == carItem.id)
                    .sort((a, b) => a.time - b.time)

                if (selectedTrajectory.length > 0) {
                    let currentcar = carIconInit(carItem.id, selectedTrajectory[0].location)
                    currentcar.trajectoryList = selectedTrajectory
                    trajectoryMeshList.push(TrajectoryList)
                }
            })
    
    }

    const ringEffect  = useRef([])
    function addRingEffect(coordinate, color) {
        let selectConsumption = consumptionDots.filter(d => d.dayStr === selectDay && d.id && activeCar.includes(d.id))
        exitConsumeDot = []
        chain(selectConsumption)
            .map('location')
            .uniq()
            .value()
            .forEach(key => {
                let material = getMaterial(0, color)
                let ringObj = new RingEffect(findLocationCoord(key), {
                    radius: 200
                }, material, threeLayer)
                ringEffect.current.push(ringObj)
                threeLayer.addMesh(ringObj)
            })
    }

    function removeRingEffect(coordinate, color) {
        threeLayer.removeMesh(ringEffect.current)
        ringEffect.current = []
    }

    function getMaterial(type = 0, color) {
        var ringShield = {
            uniforms: {
                color: {
                    type: "c",
                    value: new THREE.Color(color)
                },
                time: {
                    type: "f",
                    value: -1.5
                },
                type: {
                    type: "f",
                    value: type || 0
                },
                num: {
                    type: "f",
                    value: 4
                }
            },
            vertexShaderSource: `
                        varying vec2 vUv;
                        void main(){
                                vUv = uv;
                                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                        }`,
            fragmentShaderSource: `
                        uniform float time;
                        uniform vec3 color;
                        uniform float type;
                        uniform float num;
                        varying vec2 vUv;
                        void main(){
                            float alpha = 1.0;
                            float dis = distance(vUv,vec2(0.5));//0-0.5
                            if(dis > 0.5){
                                discard;
                            }
                            if(type ==0.0){
                                    float y = (sin(6.0 * num *(dis-time)) + 1.0)/2.0;
                                alpha = smoothstep(1.0,0.0,abs(y-0.5)/0.5) * (0.5 -dis) * 2.;
                            }else if(type ==1.0){
                                    float step = fract(time* 4.)* 0.5;
                                if(dis<step){
                                        // alpha = smoothstep(1.0,0.0,abs(step-dis)/0.15);
                                    alpha =1.- abs(step-dis)/0.15;
                                }else{
                                        alpha = smoothstep(1.0,0.0,abs(step-dis)/0.05);
                                }
                                alpha *= (pow((0.5 -dis)* 3.0,2.0));
                            }
                            gl_FragColor = vec4(color,alpha );
                        }`
        }
        let material = new THREE.ShaderMaterial({
            uniforms: ringShield.uniforms,
            defaultAttributeValues: {},
            vertexShader: ringShield.vertexShaderSource,
            fragmentShader: ringShield.fragmentShaderSource,
            blending: THREE.AdditiveBlending,
            depthWrite: !1,
            depthTest: !0,
            side: THREE.DoubleSide,
            transparent: !0,
            fog: !0
        })
        return material
    }
    //Consumption dot///////////////////////////////////////////////////////////////////////////////////////////////////
    function drawConsumptionDots() {
        if (!already) return
        threeLayer.removeMesh(exitConsumeDot)
        let selectConsumption = consumptionDots.filter(d => d.dayStr === selectDay && d.id && activeCar.includes(d.id))
        exitConsumeDot = []
        chain(selectConsumption)
            .map('location')
            .uniq()
            .value()
            .forEach(key => {
                const thisData = selectConsumption.filter(d => d.location === key)
                const ConsumptionDotsScale = 0.0008
                let outlierScale = 1
                let meandata = mean(thisData, d => d.price)
                let devia = deviation(thisData, d => d.price)
                const coor = findLocationCoord(key)
                thisData.forEach(function (data) {
                    const color = calcualteStoreColor(data.location)
                    let num = Math.abs((data.price - meandata) / devia) < outlierScale
                    let consumptionDotMaterial = getConsumptionDotMaterial(num, color)
                    let thisCoor = []
                    let random = Math.random()
                    if (random > 0.5) { thisCoor.push(coor[0] + buildingR + random * ConsumptionDotsScale) }
                    else { thisCoor.push(coor[0] - buildingR - random * ConsumptionDotsScale) }
                    random = Math.random()
                    if (random > 0.5) { thisCoor.push(coor[1] + buildingR + random * ConsumptionDotsScale) }
                    else { thisCoor.push(coor[1] - buildingR - random * ConsumptionDotsScale) }
                    const point = threeLayer.toPoint(
                        thisCoor,
                        { height: 5 }, consumptionDotMaterial)
                    point.setToolTip("id:" + data.id + " price:" + data.price + " type:  " + data.type, {
                        showTimeout: 0,
                        eventsPropagation: true,
                        dx: 10
                    });
                    exitConsumeDot.push(point)
                    threeLayer.addMesh(point)
                })
            })
    }

    //animation & GUI///////////////////////////////////////////////////////////////////////////////////////////////////
    function animation() {
        threeLayer._needsUpdate = !threeLayer._needsUpdate
        if (threeLayer._needsUpdate) {
            threeLayer.renderScene()
        }
        stats.update()
        requestAnimationFrame(animation)
    }

    // 画车的轨迹
    function addOverlapLines(selectedIDList) {
        const Overlaplines = []
        threeLayer.removeMesh(exitTrack)
        exitTrack = []
        selectedIDList.forEach(function (id, num) {
            let TrajectoryList = {
                "id": id,
                lines: []
            }
            let stopLongLines = []
            let stopShortLines = []
            let moveLines = []
            let stopLongLinesmaterial = new THREE.LineMaterial({
                color: '#F74646',
                transparent: true,
                linewidth: OverlapLineWidth,
                opacity: 0.1
            })

            let stopShortLinesmaterial = new THREE.LineMaterial({
                color: '#FFD306',
                transparent: true,
                linewidth: OverlapLineWidth,
                opacity: 0.1
            })

            let moveLinesmaterial = new THREE.LineMaterial({
                color: '#8DFF33',
                transparent: true,
                linewidth: OverlapLineWidth,
                opacity: 0.1
            })
            let selectedTrajectory = trajectoryInfo.filter(d => {
                return d.id == id && d.dayStr === selectDay
            }).sort((a, b) => a.time - b.time)
            
            if (selectedTrajectory.length === 0) return
            for (let i = 1; i < selectedTrajectory.length; i++) {
                let line = new maptalks.LineString([
                    selectedTrajectory[i - 1].location,
                    selectedTrajectory[i].location
                ])
                let length = selectedTrajectory[i].time - selectedTrajectory[i - 1].time
                if (length >= timeToplimit) {
                    stopLongLines.push(line)
                } else if (length >= timeButtomlimit) {
                    stopShortLines.push(line)
                } else moveLines.push(line)
            }

            function TrajectoryLinesMeshes(LinesList, material) {
                if (LinesList.length > 0) {
                    let Trajectory = threeLayer.toFatLines(LinesList, { interactive: true }, material)
                    threeLayer.addMesh(Trajectory)
                    exitTrack.push(Trajectory)
                    Trajectory.setAltitude(200 + Overlaplines.length * 80)
                    Trajectory.setToolTip(id, {
                        showTimeout: 0,
                        eventsPropagation: true,
                        dx: 10
                    })
                    TrajectoryList.lines.push(Trajectory)
                }
            }

            TrajectoryLinesMeshes(stopLongLines, stopLongLinesmaterial)
            TrajectoryLinesMeshes(stopShortLines, stopShortLinesmaterial)
            TrajectoryLinesMeshes(moveLines, moveLinesmaterial)
            Overlaplines.push(TrajectoryList)
        })

    }


    function carIconInit(id, location) {
        let [car] = carInfo.filter(function (car) { return car.id == id })
        const point = threeLayer.toPoint(location, { height: 50 }, car.carIconMaterial)
        point.setToolTip(id, {
            showTimeout: 0,
            eventsPropagation: true,
            dx: 10
        });
        point.setAltitude(200 + activeCar.findIndex(d => d == id) * 80 + 80)

        threeLayer.addMesh(point)
        exitCar2DTrack.push(point)
        car.point = point
        animation()
        return car
    }

    const [timeStamp, settimeStamp] = useState('00:00:00')
    const [isplay, setisplay] = useState(false)

    const [starthour, setstarthour] = useState(6)
    const [endhour, setendhour] = useState(23)
    const [speed, setspeed] = useState(100)
    return (
        <div className='map-content'>
            <div id='map' />
            <select
                value={selectDay}
                className='changeTime'
                onChange={e => {
                    changeSelectDay(e.target.value)
                }}
            >
                {dayStr.map(d => {
                    return (
                        <option key={d}>{d}</option>
                    )
                })}
            </select>
            <div className='play'>
                <label>starthour</label>
                <input type="number" placeholder='starthour' min='0' max='23' value={starthour} onChange={e => {
                    setstarthour(e.target.value)
                }} />
                <label htmlFor="">endhour</label>
                <input type="number" placeholder='endhour' min='0' max='23' value={endhour} onChange={e => {
                    setendhour(e.target.value)
                }} />
                <label htmlFor="">speed</label>
                <input type="number" placeholder='endhour' min='0' value={speed} onChange={e => {
                    setspeed(e.target.value)
                }} />
                <button onClick={() => {
                    const newplay = !isplay
                    setisplay(!isplay)
                    if (run) clearInterval(run)
                    if (!newplay) {
                        settimeStamp('00:00:00')
                        return
                    }
                    let startTimeStamp = moment(`${selectDay} ${starthour}:00:00`).unix()
                    let endTimeStamp = moment(`${selectDay} ${endhour}:59:59`).unix()
                    const useGpsData = trajectoryInfo.filter(d => d.dayStr === selectDay)
                    let oldlocation = []
                    run = setInterval(function () {
                        startTimeStamp = startTimeStamp + 60
                        settimeStamp(moment(startTimeStamp * 1000).format('HH:mm:ss'))
                        if (startTimeStamp > endTimeStamp) clearInterval(run)
                        activeCar.forEach(carId => {
                            const gpsData = useGpsData.filter(d => d.id == carId)
                            if (gpsData.length < 0) {
                                clearInterval(run)
                                return
                            }
                            const nextData = gpsData.find(d => d.time - new Date(startTimeStamp * 1000) >= 0)
                            if (!nextData) return
                            const { location } = nextData
                            if (location.join('-')=== oldlocation) return
                            oldlocation = location.join('-')
                            let [car] = carInfo.filter(function (car) { return car.id == carId })
                                car.point.remove()
                                carIconInit(car.id, location)

                        }) 
                    }, 1000 / speed)
                }}>
                    {isplay ? 'pause' : 'play'}
                </button>
            </div>
            <text>{timeStamp}</text>
        </div>
    )
}

export default observer(Map3D)