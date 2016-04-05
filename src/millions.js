exports.Color = require('./Color');
exports.Scene = require('./Scene');
exports.Camera = require('./Camera');
exports.WebGL1Renderer = require('./WebGL1Renderer');

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
