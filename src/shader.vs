precision highp float;

attribute vec2 pos;
attribute vec2 linePos;
attribute vec4 color;
attribute float radius;

uniform vec2 frameSize;
uniform vec2 focalPoint;
uniform float zoom;
uniform float pixelDensity;

varying vec2 linePosToFrag;
varying float radiusToFrag;
varying vec4 colorToFrag;

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
    colorToFrag = color;
    radiusToFrag = radius * zoom * pixelDensity;
    linePosToFrag = translatePosToFrag(linePos);

    gl_Position = vec4(translatePos(pos), 1.0, 1.0);
}
