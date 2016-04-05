var geom = require('./geom');

// cameras map scene coordinates into homogenous coordinates.
//
// cameras are restricted to being transformations of set parameters rather than
// just being a light wrapper around a fully flexible transformation matrix. this
// mimics a real camera and makes it easier to animate from one camera angle to
// another in an aesthetically pleasing manner. the camera's parameters are:
//
//  - focal point (XY)
//  - zoom
//  - rotation
//
// note that because we're mapping to homogenous coordinates, the zoom parameter
// will end up being a rather small value in practice as zoom = 1 means that the
// areas covered by the camera is only one unit in size. if you're unsure of good
// parameter values, use withSceneInFrame() to ensure that *something* is visible
// and then look at the resulting parameters.
//
// cameras produce the same mapping regardless of output frame size. this means
// that doubling the size of the output framebuffer will just double the size of
// the content, rather than showing more content around the edges.
//
// also note that cameras *are* aspect ratio correct - you aren't allowed to
// actually access parameter values because some of them need to be late bound in
// the renderer (i.e if you don't know the aspect ratio of the renderer you can't
// figure out how far you'd have to zoom in/out to fit the area in frame, and you
// can't access the aspect ratio if you're using a React component.

export default class Camera {
    constructor(focalX = 0, focalY = 0, zoom = 1, rotation = 0) {
        console.log('hello camera');
        this.focalX = focalX;
        this.focalY = focalY;
        this.zoom = zoom;
        this.rotation = rotation;
    }

    __clone() {
        return new Camera(this.focalX, this.focalY, this.zoom, this.rotation);
    }

    withRectangleInFrame(rect) {
        return this.__clone();
    }

    withSceneInFrame(scene, padding) {
        var rect = geom.padRect(scene.boundingBox(), padding);
        return this.withRectangleInFrame(rect);
    }

    withAspectRatio(aspect) {
        var cpy = this.__clone();
        cpy.aspect = aspect;

        return cpy;
    }

    withFocalPoint(x, y) {
        return Object.assign(this.__clone(), {
            focalX: x,
            focalY: y
        });
    }

    withZoom(zoom) {
        return Object.assign(this.__clone(), {
            zoom: zoom
        });
    }
}
