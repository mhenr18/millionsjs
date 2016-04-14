precision highp float;

const float AA_PIXELS = 2.0;

attribute vec2 pos;
attribute vec4 color;
attribute float radius;
attribute vec2 drpos;
attribute vec2 norm;
attribute float baryIndex;
attribute float baryUnitLengthNormalised;

uniform vec2 frameSize;
uniform vec2 focalPoint;
uniform float zoom;
uniform float pixelDensity;

varying vec4 colorToFrag;
varying float radiusToFrag;
varying vec2 radialPosToFrag;
varying vec3 baryPosToFrag;
varying float baryFracPerPixel;

vec2 translatePos(vec2 p)
{
    vec2 tpos = p - focalPoint;

    tpos -= frameSize / 2.0;
    tpos /= frameSize / 2.0;
    tpos += vec2(1.0, 1.0);

    tpos.y *= -1.0;
    tpos *= vec2(zoom, zoom);

    return tpos;
}

vec2 translatePosToFrag(vec2 p)
{
    vec2 tpos = translatePos(p);
    tpos += vec2(1.0, 1.0);
    tpos *= (frameSize * pixelDensity) / 2.0;

    return tpos;
}

void main()
{
    vec2 rpos = pos + (drpos * 512.0);
    vec2 trueNorm = norm * 2.0;
    vec2 pixelNorm = trueNorm / (zoom * pixelDensity);
    float baryUnitLength = baryUnitLengthNormalised * 1024.0;
    float extensionPixels = AA_PIXELS + 2.0;

    colorToFrag = color;
    radiusToFrag = radius * 1024.0 * zoom * pixelDensity;
    radialPosToFrag = translatePosToFrag(rpos);

    if (radius == 0.0) {
        // HACK - I honestly have no clue why we need this...
        extensionPixels *= 2.0;

        // how long is a pixel in multiples of a bary unit?
        baryFracPerPixel = (1.0 / (zoom * pixelDensity)) / baryUnitLength;

        // because the bary extension is extensionPixels * that frac
        float baryExtension = extensionPixels * baryFracPerPixel;
        baryPosToFrag = vec3(-baryExtension / 2.0, -baryExtension / 2.0, -baryExtension / 2.0);

        if (baryIndex == 2.0) {
            baryPosToFrag.x = 1.0 + baryExtension;
        } else if (baryIndex == 3.0) {
            baryPosToFrag.y = 1.0 + baryExtension;
        } else {
            baryPosToFrag.z = 1.0 + baryExtension;
        }
    }

    gl_Position = vec4(translatePos(pos + pixelNorm * extensionPixels), 1.0, 1.0);
}
