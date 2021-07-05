/*!
 * Code from baidu mapv
 * License: BSD-3
 * https://github.com/huiyan-fe/mapv
 *
 */

/**
 * https://github.com/huiyan-fe/mapv/blob/master/src/canvas/draw/heatmap.js
 */
import { createCanvas } from './../CanvasUtil';
import Intensity from './Intensity';

function createCircle(size) {
    var shadowBlur = size / 2;
    var r2 = size + shadowBlur;
    var offsetDistance = 10000;

    var circle = createCanvas(r2 * 2, r2 * 2);
    var context = circle.getContext('2d');

    context.shadowBlur = shadowBlur;
    context.shadowColor = 'black';
    context.shadowOffsetX = context.shadowOffsetY = offsetDistance;

    context.beginPath();
    context.arc(r2 - offsetDistance, r2 - offsetDistance, size, 0, Math.PI * 2, true);
    context.closePath();
    context.fill();
    return circle;
}

function colorize(pixels, gradient, options) {
    var max = getMax(options);
    var min = getMin(options);
    var diff = max - min;
    var range = options.range || null;

    var jMin = 0;
    var jMax = 1024;
    if (range && range.length === 2) {
        jMin = (range[0] - min) / diff * 1024;
    }

    if (range && range.length === 2) {
        jMax = (range[1] - min) / diff * 1024;
    }

    var maxOpacity = options.maxOpacity || 0.8;
    var minOpacity = options.minOpacity || 0;
    // var range = options.range;

    for (var i = 3, len = pixels.length, j; i < len; i += 4) {
        j = pixels[i] * 4; // get gradient color from opacity value

        if (pixels[i] / 256 > maxOpacity) {
            pixels[i] = 256 * maxOpacity;
        }
        if (pixels[i] / 256 < minOpacity) {
            pixels[i] = 256 * minOpacity;
        }

        if (j && j >= jMin && j <= jMax) {
            pixels[i - 3] = gradient[j];
            pixels[i - 2] = gradient[j + 1];
            pixels[i - 1] = gradient[j + 2];
        } else {
            pixels[i] = 0;
        }
    }
}

function getMax(options) {
    var max = options.max || 100;
    return max;
}

function getMin(options) {
    var min = options.min || 0;
    return min;
}

function drawGray(context, dataSet, options) {

    var max = getMax(options);
    // var min = getMin(options);
    // console.log(max)
    var size = options._size || options.size || 13;

    var circle = createCircle(size);
    var circleHalfWidth = circle.width / 2;
    var circleHalfHeight = circle.height / 2;

    var data = dataSet;

    var dataOrderByAlpha = {};

    data.forEach(function (item) {
        var count = item.count === undefined ? 1 : item.count;
        var alpha = Math.min(1, count / max).toFixed(2);
        dataOrderByAlpha[alpha] = dataOrderByAlpha[alpha] || [];
        dataOrderByAlpha[alpha].push(item);
    });

    for (var i in dataOrderByAlpha) {
        if (isNaN(i as any)) continue;
        var _data = dataOrderByAlpha[i];
        context.beginPath();
        if (!options.withoutAlpha) {
            context.globalAlpha = i;
        }
        // context.strokeStyle = intensity.getColor(i * max);
        _data.forEach(function (item) {
            var coordinates = item.coordinate;
            var count = item.count === undefined ? 1 : item.count;
            context.globalAlpha = count / max;
            context.drawImage(circle, coordinates[0] - circleHalfWidth, coordinates[1] - circleHalfHeight);
        });

    }
}

function draw(context, data, options) {
    if (context.canvas.width <= 0 || context.canvas.height <= 0) {
        return;
    }

    var strength = options.strength || 0.3;
    context.strokeStyle = 'rgba(0,0,0,' + strength + ')';

    // var shadowCanvas = new Canvas(context.canvas.width, context.canvas.height);
    var shadowCanvas = createCanvas(context.canvas.width, context.canvas.height);
    var shadowContext = shadowCanvas.getContext('2d');
    shadowContext.scale(devicePixelRatio, devicePixelRatio);

    options = options || {};

    // var data = dataSet instanceof DataSet ? dataSet.get() : dataSet;

    context.save();

    var intensity = new Intensity({
        gradient: options.gradient
    });

    drawGray(shadowContext, data, options);
    // return false;
    if (!options.absolute) {
        var colored = shadowContext.getImageData(0, 0, context.canvas.width, context.canvas.height);
        colorize(colored.data, intensity.getImageData(), options);
        context.putImageData(colored, 0, 0);

        context.restore();
    }

    intensity = null;
    shadowCanvas = null;
}

export default {
    draw,
    drawGray,
    colorize
};
