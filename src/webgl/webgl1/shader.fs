precision highp float;

const float AA_PIXELS = 30.0;

varying vec4 colorToFrag;
varying vec3 baryToFrag;
varying float baryExtensionToFrag;
varying float baryFracPerPixel;
varying float radiusToFrag;
varying vec2 radialPosToFrag;

float invlerp(float a, float b, float c)
{
    return (c - a) / (b - a);
}

void main()
{
    if (radiusToFrag > 0.0) {
        // radial antitaliasing
        float distToRadial = distance(radialPosToFrag, gl_FragCoord.xy);
        float distToRadius = distToRadial - radiusToFrag;
        float raa = clamp(invlerp(AA_PIXELS, 0.0, distToRadius), 0.0, 1.0);
        gl_FragColor = vec4(colorToFrag.rgb, raa);
    } else {
        // barycentric antitaliasing
        float aaX = clamp(invlerp(-baryFracPerPixel * AA_PIXELS, 0.0, baryToFrag.x), 0.0, 1.0);
        float aaY = clamp(invlerp(-baryFracPerPixel * AA_PIXELS, 0.0, baryToFrag.y), 0.0, 1.0);
        float aaZ = clamp(invlerp(-baryFracPerPixel * AA_PIXELS, 0.0, baryToFrag.z), 0.0, 1.0);
        float taa = aaZ;

        gl_FragColor = vec4(colorToFrag.rgb, taa);
    }
}
