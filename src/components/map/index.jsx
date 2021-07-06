import { csv } from 'd3-fetch'
import { interpolateRgb } from 'd3-interpolate'
import React, { useEffect, useState } from 'react'
import { building_coordinate } from '../../data/buliding_coordinate'
import consumptionDots from '../../data/consumptionDots'
import road from '../../data/abila_maps'
import './index.scss'
import { observer } from 'mobx-react'
import systemStore from '../../page/system/store'
import { chain } from 'lodash'
import { dayStr } from '../../data/consumer_data'

const colorScale4Trajectory = interpolateRgb('#8DFF33', '#F74646')
const fatLineWidth = 4, OverlapLineWidth = 8 // in pixels
let trajectoryInfo
let timeToplimit = 1800000
let timeButtomlimit = 30000
const buildingColor = {
    "Restaurant": "#e67e7d",
    "Parter": "#80c680",
    "Shop": "#c0a4d7",
    "Entertainment": "#78acd3",
    "Other": "#ffb26e",
    "home": "#ffffff"
}
const buildingR = 0.00025
let stats = null

const { maptalks, Stats, THREE,
    getLinePosition,
    _getLinePosition,
    MeshLine,
    MeshLineMaterial,dat } = window



var OPTIONS = {
    altitude: 0,
    speed: 0.001
}

class SpriteLine extends maptalks.BaseObject {
    constructor(lineString, options, material, layer) {
        super()
        options.offset = material.uniforms.offset.value
        options.clock = new THREE.Clock()
        //geoutil.js getLinePosition
        const { positions } = getLinePosition(lineString, layer)
        const positions1 = _getLinePosition(lineString, layer).positions

        options = maptalks.Util.extend({}, OPTIONS, options, { layer, lineString, positions: positions1 })
        this._initOptions(options)

        const geometry = new THREE.Geometry()
        for (let i = 0; i < positions.length; i += 3) {
            geometry.vertices.push(new THREE.Vector3(positions[i], positions[i + 1], positions[i + 2]))
        }
        const meshLine = new MeshLine()
        meshLine.setGeometry(geometry)

        const map = layer.getMap()
        const size = map.getSize()
        const width = size.width
        const height = size.height
        material.uniforms.resolution.value.set(width, height)

        const line = new THREE.Mesh(meshLine.geometry, material)
        this._createGroup()
        this.getObject3d().add(line)
        const { altitude } = options
        const z = layer.distanceToVector3(altitude, altitude).x
        const center = lineString.getCenter()
        const v = layer.coordinateToVector3(center, z)
        this.getObject3d().position.copy(v)
    }
    _animation() {
        this.options.offset.x -= this.options.speed * this.options.clock.getDelta()
    }
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

let exitTrack = []

function Map3D() {

    const { activeCar, resetCar, selectDay, changeSelectDay } = systemStore

    const [map, setmap] = useState(null)


    useEffect(() => {
        // document.getElementById('map').innerHTML = ''
        const newmap = new maptalks.Map(
                "map", {
                    center: [24.870, 36.071],
                    zoom: 14,
                    pitch: 70,
                    bearing: 180,
                    centerCross: true,
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
        
                let light = new THREE.DirectionalLight(0xffffff)
                light.position.set(0, -10, 10).normalize()
                scene.add(light)
        
                //地图线
                addLines()
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
        addOverlapLines(activeCar)
        drawConsumptionDots(activeCar)
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
    let buildings = []

    function drawBuildings() {
        building_coordinate.forEach(function (building, num) {
            let centerLong = (building.range[0][0] + building.range[1][0]) / 2
            let centerLat = (building.range[0][1] + building.range[1][1]) / 2
            let polygon = new maptalks.Polygon([
                [
                    [centerLong - buildingR, centerLat - buildingR],
                    [centerLong + buildingR, centerLat - buildingR],
                    [centerLong + buildingR, centerLat + buildingR],
                    [centerLong - buildingR, centerLat + buildingR],
                    [centerLong - buildingR, centerLat - buildingR]
                ]
            ])
            let color = buildingColor[building.type]
            let material = new THREE.MeshPhongMaterial({
                color: color,
                opacity: 0.5,
                transparent: true
            })
            let extrudePolygon = threeLayer.toExtrudePolygon(polygon, {
                interactive: true,
                height: 500 * Math.random(),
                topColor: color
            }, material)
            extrudePolygon.id = building.name
            extrudePolygon.on('click', function (e) {
                const select = e.target
                // select.object3d.material.opacity = 1
                let coordinate = {
                    x: centerLong,
                    y: centerLat
                }
                addRingEffect(coordinate, color)
                const location = select.id
                const customData = consumptionDots.filter(d => {
                    return d.location === location && d.timestamp.split(' ')[0] === selectDay
                })
                const carId = chain(customData).map('id').uniq().compact().value()
                console.log(carId)
                resetCar(carId)
            })
            threeLayer.addMesh(extrudePolygon)
            buildings.push(extrudePolygon)
        })

    }

    //Trajectory Line///////////////////////////////////////////////////////////////////////////////////////////////////

    let trajectoryMeshes = []

    function addTrajectoryLines(geojsonURL, textureURL) {
        fetch(geojsonURL).then(function (res) {
            return res.text()
        }).then(function (text) {
            return JSON.parse(text)
        }).then(function (geojson) {
            let texture = new THREE.TextureLoader().load(textureURL)
            texture.anisotropy = 16
            texture.wrapS = THREE.RepeatWrapping
            texture.wrapT = THREE.RepeatWrapping
            let camera = threeLayer.getCamera()
            let material = new MeshLineMaterial({
                map: texture,
                useMap: true,
                lineWidth: 13,
                sizeAttenuation: false,
                transparent: true,
                near: camera.near,
                far: camera.far
            })
            let multiLineStrings = maptalks.GeoJSON.toGeometry(geojson)
            for (let multiLineString of multiLineStrings) {
                let lines = multiLineString._geometries.map(lineString => {
                    return new SpriteLine(lineString, { altitude: 0 }, material, threeLayer)
                })
                threeLayer.addMesh(lines)
                trajectoryMeshes = trajectoryMeshes.concat(lines)
            }
        })
    }

    function addRingEffect(coordinate, color) {
        let material = getMaterial(0, color)
        let ringObj = new RingEffect(coordinate, {
            radius: 200
        }, material, threeLayer)
        threeLayer.addMesh(ringObj)
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
    function drawConsumptionDots(carId) {
        let circleMaterial = new THREE.MeshPhongMaterial({
            color: 'red',
            opacity: 1,
            transparent: true
        })
        let selectConsumption = consumptionDots.filter(function (d) {
            return carId.includes(d.id) && d.dayStr === selectDay
        })
        selectConsumption.forEach(function (data) {
            var center = map.getCenter()
            var circle = new maptalks.Circle(center.add(data.coor[0], data.coor[1]), {
                radius: 2000
            }, circleMaterial, threeLayer)
            threeLayer.addMesh(circle)
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

    //GUI
    function initGui() {
        var params = {
            add: true,
            color: 0xa7b4d4,
            show: true,
            opacity: 0.4,
            altitude: 0,
            interactive: false,
            speed: OPTIONS.speed
        }
        var gui = new dat.GUI()
        gui.width = 400

        gui.add(params, 'show').name('Show all Road').onChange(function () {
            lines.forEach(function (mesh) {
                if (params.show) {
                    mesh.show()
                } else {
                    mesh.hide()
                }
            })
        })
        gui.addColor(params, 'color').name('Road Color').onChange(function () {
            fatLinesmaterial.color.set(params.color)
            lines.forEach(function (mesh) {
                mesh.setSymbol(fatLinesmaterial)
            })
        })
        gui.add(params, 'opacity', 0, 1).name('Road Opacity').onChange(function () {
            fatLinesmaterial.uniforms.opacity.value = (params.opacity)
            lines.forEach(function (mesh) {
                mesh.setSymbol(fatLinesmaterial)
            })
        })


        gui.add(params, 'interactive').name('Road Interactivity').onChange(function () {
            lines.forEach(function (mesh) {
                mesh.options.interactive = params.interactive
            })
        })

        gui.add(params, 'altitude', 0, 700).name('Trajectory Altitude').onChange(function () {
            trajectoryMeshes.forEach(function (mesh) {
                mesh.setAltitude(params.altitude)
            })
        })
        gui.add(params, 'speed', 0.001, 0.1, 0.001).name('Trajectory Speed').onChange(function () {
            trajectoryMeshes.forEach(function (mesh) {
                mesh.options.speed = params.speed
            })
        })
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

            if (stopLongLines.length > 0) {
                let stopLongTrajectory = threeLayer.toFatLines(stopLongLines, { interactive: false }, stopLongLinesmaterial)
                stopLongTrajectory.setAltitude(200 + Overlaplines.length * 50)
                TrajectoryList.lines.push(stopLongTrajectory)
                threeLayer.addMesh(stopLongTrajectory)
                exitTrack.push(stopLongTrajectory)
            }
            
            if (stopShortLines.length > 0) {
                let stopShortTrajectory = threeLayer.toFatLines(stopShortLines, { interactive: false }, stopShortLinesmaterial)
                stopShortTrajectory.setAltitude(200 + Overlaplines.length * 50)
                TrajectoryList.lines.push(stopShortTrajectory)
                threeLayer.addMesh(stopShortTrajectory)
                exitTrack.push(stopShortTrajectory)
            }

            if (moveLines.length > 0) {
                let moveTrajectory = threeLayer.toFatLines(moveLines, { interactive: false }, moveLinesmaterial)
                exitTrack.push(moveTrajectory)
                moveTrajectory.setAltitude(200 + Overlaplines.length * 50)
                TrajectoryList.lines.push(moveTrajectory)
                threeLayer.addMesh(moveTrajectory)
            }
            Overlaplines.push(TrajectoryList)
        })

    }

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
        </div>
    )
}

export default observer(Map3D)