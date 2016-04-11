exports.Color = require('./Color');
exports.Scene = require('./entities/Scene');
exports.Line = require('./entities/Line');
exports.Triangle = require('./entities/Triangle');
exports.Camera = require('./Camera');
exports.WebGL1Renderer = require('./webgl/webgl1/WebGL1Renderer');
exports.LineCaps = require('./entities/LineCaps');

exports.createRenderer = function (mountPoint) {
    var rendererClass = exports.getBestSupportedRenderer();
    return new rendererClass(mountPoint);
};

exports.getBestSupportedRenderer = function () {
    if (exports.WebGL1Renderer.isSupported()) {
        return exports.WebGL1Renderer;
    }

    throw new Error('no renderer is supported by your browser');
};
