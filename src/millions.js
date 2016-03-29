exports.Color = require('./Color');
exports.Scene = require('./Scene');
exports.Camera = require('./Camera');
exports.WebGL1Renderer = require('./WebGL1Renderer');

exports.createRenderer = function (mountPoint) {
    if (exports.WebGL1Renderer.isSupported()) {
        return new exports.WebGL1Renderer(mountPoint);
    }

    throw new Error('unable to create a renderer -- nothing is supported by your browser');
};
