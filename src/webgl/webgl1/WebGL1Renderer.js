const utils = require('../WebGLUtils');
const BufferManager = require('./BufferManager');
const Scene = require('../../entities/Scene');
const BufferRegion = require('./BufferRegion');

export default class WebGL1Renderer {
    constructor(canvas) {
        var opts = {
            premultipliedAlpha: false,
            alpha: false,
            antialias: false
        };

        this.gl = canvas.getContext('webgl', opts) || canvas.getContext('experimental-webgl', opts);

        this.prevCanvasWidth = null;
        this.prevCanvasHeight = null;
        this.uniforms = {};
        this.attributes = {};
        this.bufferManager = new BufferManager(this.gl);
        this.pixelDensity = 2;
        this.prevScene = new Scene();
        this.bufferRegions = [
            new BufferRegion(Number.MIN_VALUE)
        ];

        this._setupWebGL();
    }

    getBufferRegionForZIndex(zIndex) {
        for (var i = 0; i < this.bufferRegions.length; ++i) {
            if (this.bufferRegions[i].minIndex <= zIndex) {
                return this.bufferRegions[i];
            }
        }

        throw new Error('this is impossible');
    }

    render(scene, camera) {
        const gl = this.gl;
        const canvas = gl.canvas;
        const bgColor = scene.bgColor;
        const focalPoint = { x: camera.focalX, y: camera.focalY };
        const zoom = camera.zoom;
        const pixelDensity = this.pixelDensity;
        var i, j;

        this._updateViewport(pixelDensity);

        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.clearColor(bgColor.r / 255.0, bgColor.g / 255.0, bgColor.b / 255.0,
                      bgColor.a / 255.0);
        gl.clear(gl.COLOR_BUFFER_BIT);

        gl.useProgram(this.prog);

        // shader uniforms
        gl.uniform2f(this.uniforms.frameSize, canvas.clientWidth, canvas.clientHeight);
        gl.uniform2f(this.uniforms.focalPoint, focalPoint.x, focalPoint.y);
        gl.uniform1f(this.uniforms.zoom, zoom);
        gl.uniform1f(this.uniforms.pixelDensity, pixelDensity);

        // mark buffers that need updates
        var diff = this.prevScene.compareTo(scene, {
            ordered: true,
            comparison: function (a, b) {
                return a.zIndex - b.zIndex;
            }
        });

        diff.forEachPrimitive((primOp) => {
            this.getBufferRegionForZIndex(primOp.value.zIndex).mark();
        });

        // join consecutive marked buffers (if we have to regen them, we may as
        // well join them for free to ensure we're packing entities as tightly as
        // possible)
        for (i = 0; i < this.bufferRegions.length; ++i) {
            if (this.bufferRegions[i].isMarked()) {
                // remove any adjacent regions that are marked, that'll merge them
                // into this one
                for (j = i + 1; j < this.bufferRegions.length; ) {
                    if (this.bufferRegions[j].isMarked()) {
                        this.bufferRegions.splice(j, 1);
                    } else {
                        break;
                    }
                }
            }
        }

        // and now we get to render regions - as we render we may run out of
        // space within a region's VBO and need to split it apart, resulting in
        // new regions being added.
        for (i = 0; i < this.bufferRegions.length; ++i) {
            var endIndex = (i < this.bufferRegions.length - 1) ? this.bufferRegions[i + 1].minIndex : Number.MAX_VALUE;
            var extraRegions = this._renderRegion(this.bufferRegions[i], endIndex, scene);

            if (extraRegions != null && extraRegions != []) {
                this.bufferRegions.splice(i + 1, 0, extraRegions);
            }
        }

        gl.useProgram(null);
    }

    aspectRatio() {
        this._updateViewport(this.pixelDensity);
        return this.gl.canvas.width / this.gl.canvas.height;
    }

    _setupWebGL() {
        const gl = this.gl;

        // shader, attribute and uniform locations
        this.prog = utils.loadProgram(this.gl, require('raw!./shader.vs'),
                                      require('raw!./shader.fs'));

        ['pos', 'drpos', 'radius', 'norm', 'color', 'baryUnitLengthNormalised', 'baryIndex'].forEach((name) => {
            this.attributes[name] = gl.getAttribLocation(this.prog, name);
        });

        ['frameSize', 'focalPoint', 'zoom', 'pixelDensity'].forEach((name) => {
            this.uniforms[name] = gl.getUniformLocation(this.prog, name);
        });

        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    }

    _updateViewport(pixelDensity) {
        const canvas = this.gl.canvas;

        if (this.prevCanvasWidth != Math.round(canvas.clientWidth * pixelDensity) ||
            this.prevCanvasHeight != Math.round(canvas.clientHeight * pixelDensity))
        {
            this.prevCanvasWidth = Math.round(canvas.clientWidth * pixelDensity);
            this.prevCanvasHeight = Math.round(canvas.clientHeight * pixelDensity);

            canvas.width = this.prevCanvasWidth;
            canvas.height = this.prevCanvasHeight;
            console.log('canvas resized to', canvas.width, canvas.height);
        }
    }

    _renderRegion(region, endIndex, scene) {
        const gl = this.gl;

        const { buffer, extraRegions } = this.bufferManager.getBufferForRegion(region, endIndex, scene.entities);

        gl.bindBuffer(gl.ARRAY_BUFFER, buffer.vbo);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer.ibo);

        // enable vertex attribs and setup their offsets
        gl.enableVertexAttribArray(this.attributes.pos);
        gl.vertexAttribPointer(this.attributes.pos, 2, gl.FLOAT, false, BufferManager.VERT_SIZE, 0);

        gl.enableVertexAttribArray(this.attributes.drpos);
        gl.vertexAttribPointer(this.attributes.drpos, 2, gl.SHORT, true, BufferManager.VERT_SIZE, 8);

        gl.enableVertexAttribArray(this.attributes.baryUnitLengthNormalised);
        gl.vertexAttribPointer(this.attributes.baryUnitLengthNormalised, 1, gl.UNSIGNED_SHORT, true, BufferManager.VERT_SIZE, 12);

        gl.enableVertexAttribArray(this.attributes.baryIndex);
        gl.vertexAttribPointer(this.attributes.baryIndex, 1, gl.UNSIGNED_BYTE, false, BufferManager.VERT_SIZE, 14);


        gl.enableVertexAttribArray(this.attributes.radius);
        gl.vertexAttribPointer(this.attributes.radius, 1, gl.UNSIGNED_SHORT, true, BufferManager.VERT_SIZE, 16);

        gl.enableVertexAttribArray(this.attributes.norm);
        gl.vertexAttribPointer(this.attributes.norm, 2, gl.BYTE, true, BufferManager.VERT_SIZE, 18);


        gl.enableVertexAttribArray(this.attributes.color);
        gl.vertexAttribPointer(this.attributes.color, 4, gl.UNSIGNED_BYTE, true, BufferManager.VERT_SIZE, 20);



        // and draw
        gl.drawElements(gl.TRIANGLES, buffer.numIndices, gl.UNSIGNED_SHORT, 0);

        return extraRegions;
    }
}

WebGL1Renderer.isSupported = function () {
    try {
        var canvas = document.createElement('canvas');
        var ctx = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

        if (ctx == null) {
            return false;
        }

        return true;
    } catch (e) {
        return false;
    }
};
