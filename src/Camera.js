var geom = require('./geom');

// cameras map scene coordinates into homogenous coordinates. they are aspect
// aware because that's needed to keep things looking correct when you ask for a
// whole scene to be in frame (unless you're into distorted views...).
//
// cameras are restricted to being transformations of set parameters rather than
// just being a light wrapper around a fully flexible transformation matrix. this
// mimics a real camera and makes it easier to animate from one camera angle to
// another in an aesthetically pleasing manner. the camera's parameters are:
//
//  - focal point (XY)
//  - zoom
//  - rotation
//  - aspect ratio (where an aspect ratio of 1.5 means you need to display the
//    output 150% as wide as it is high in order to get an undistorted view)
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

export default class Camera {
    constructor(focalX = 0, focalY = 0, zoom = 1, rotation = 0, aspect = 1) {
        console.log('hello camera');
        this.focalX = focalX;
        this.focalY = focalY;
        this.zoom = zoom;
        this.rotation = rotation;
        this.aspect = aspect;
    }

    __clone() {
        return new Camera(this.focalX, this.focalY, this.zoom, this.rotation,
            this.aspect);
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
}
