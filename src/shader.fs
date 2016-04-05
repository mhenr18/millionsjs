precision highp float;

varying vec2 linePosToFrag;
varying float radiusToFrag;
varying vec4 colorToFrag;

void main()
{
    const float FEATHER_AMT = 10.0;
    float distToLine = distance(linePosToFrag, gl_FragCoord.xy);
    float distToFeatherBegin = distToLine - (radiusToFrag - FEATHER_AMT);

    float aa = clamp(distToFeatherBegin, 0.0, 2.0 * FEATHER_AMT) / (2.0 * FEATHER_AMT);
    gl_FragColor = vec4(1.0 - aa, 0.0, aa, 1.0);
}
