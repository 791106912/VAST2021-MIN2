import * as maptalks from 'maptalks';
import * as THREE from 'three';
import BaseObject from './BaseObject';
import { ThreeLayer } from './index';
import { ExtrudeLineOptionType, LineStringType, MergeAttributeType } from './type/index';
import { initVertexColors } from './util/ExtrudeUtil';
import { LineStringSplit, getExtrudeLineParams } from './util/LineUtil';
import { mergeBufferGeometries } from './util/MergeGeometryUtil';
import { getVertexColors } from './util/ThreeAdaptUtil';

const OPTIONS = {
    width: 3,
    height: 1,
    altitude: 0,
    topColor: null,
    bottomColor: '#2d2f61',
};


/**
 *
 */
class ExtrudeLine extends BaseObject {
    constructor(lineString: LineStringType, options: ExtrudeLineOptionType, material: THREE.Material, layer: ThreeLayer) {
        options = maptalks.Util.extend({}, OPTIONS, options, { layer, lineString });
        super();
        this._initOptions(options);

        const { height, width, bottomColor, topColor } = options;
        options.height = layer.distanceToVector3(height, height).x;
        options.width = layer.distanceToVector3(width, width).x;
        const { lineStrings, center } = LineStringSplit(lineString);
        const extrudeParams: MergeAttributeType[] = [];
        for (let i = 0, len = lineStrings.length; i < len; i++) {
            extrudeParams.push(getExtrudeLineParams(lineStrings[i], options.width, options.height, layer, center));
        }
        const geometry = mergeBufferGeometries(extrudeParams);
        if (topColor) {
            initVertexColors(geometry, bottomColor, topColor);
            (material as any).vertexColors = getVertexColors();
        }
        this._createMesh(geometry, material);

        const { altitude } = options;
        // const center = (isGeoJSON(lineString) ? getGeoJSONCenter(lineString) : lineString.getCenter());
        const z = layer.distanceToVector3(altitude, altitude).x;
        const v = layer.coordinateToVector3(center, z);
        this.getObject3d().position.copy(v);
        this.type = 'ExtrudeLine';
    }
}

export default ExtrudeLine;
