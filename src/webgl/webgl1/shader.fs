precision highp float;

const float AA_PIXELS = 2.0;

uniform float zoom;
uniform float pixelDensity;

varying vec4 colorToFrag;
varying float radiusToFrag;
varying vec2 radialPosToFrag;
varying vec3 baryPosToFrag;
varying float baryFracPerPixel;

void main()
{
    if (radiusToFrag > 0.0) {
        float distToRadial = distance(radialPosToFrag, gl_FragCoord.xy);
        gl_FragColor = vec4(colorToFrag.xyz, smoothstep(radiusToFrag + AA_PIXELS, radiusToFrag, distToRadial));
    } else {
        float aaX = smoothstep(-baryFracPerPixel * AA_PIXELS, 0.0, baryPosToFrag.x);
        float aaY = smoothstep(-baryFracPerPixel * AA_PIXELS, 0.0, baryPosToFrag.y);
        float aaZ = smoothstep(-baryFracPerPixel * AA_PIXELS, 0.0, baryPosToFrag.z);
        float taa = min(aaX, min(aaY, aaZ));

        gl_FragColor = vec4(colorToFrag.xyz, taa);
    }
}
