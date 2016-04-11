precision highp float;

const float AA_PIXELS = 1.5;

attribute vec2 pos;
attribute vec2 norm;
attribute float baryIndex;
attribute float baryUnit;
attribute vec4 color;
attribute float radius;
attribute vec2 rpos;

uniform vec2 frameSize;
uniform vec2 focalPoint;
uniform float zoom;
uniform float pixelDensity;

varying vec4 colorToFrag;
varying vec3 baryToFrag;
varying float baryExtensionToFrag;
varying float baryFracPerPixel;
varying float radiusToFrag;
varying vec2 radialPosToFrag;

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
    vec2 tpos = pos;
    float baryExtension = 0.0;

    if (baryUnit != 0.0) {
        baryFracPerPixel = (1.0 / (zoom * pixelDensity)) / baryUnit;
        baryExtension = 100.0 * baryFracPerPixel;
        tpos = pos + (baryExtension * norm * baryUnit);
    }

    vec3 baryPos = vec3(-baryExtension / 2.0, -baryExtension / 2.0, -baryExtension / 2.0);

    // TODO: make this branchless by taking advantage of baryIndexes being prime
    if (baryIndex == 2.0) {
        baryPos.x = 1.0 + baryExtension;
    } else if (baryIndex == 3.0) {
        baryPos.y = 1.0 + baryExtension;
    } else {
        // baryIndex == 5
        baryPos.z = 1.0 + baryExtension;
    }

    colorToFrag = color;
    baryToFrag = baryPos;
    baryExtensionToFrag = baryExtension;
    radiusToFrag = radius * zoom * pixelDensity;
    radialPosToFrag = translatePosToFrag(rpos);

    gl_Position = vec4(translatePos(tpos), 1.0, 1.0);
}
