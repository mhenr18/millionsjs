
export function loadProgram(gl, vertSrc, fragSrc) {
    const prog = gl.createProgram();
    const addShader = (type, source) => {
        let shader = gl.createShader(type);

        gl.shaderSource(shader, source);
        gl.compileShader(shader);

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            throw new Error('Could not compile shader:\n\n' + gl.getShaderInfoLog(shader));
        }

        gl.attachShader(prog, shader);
    };

    addShader(gl.VERTEX_SHADER, vertSrc);
    addShader(gl.FRAGMENT_SHADER, fragSrc);

    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
        throw new Error('Could not link the shader program!');
    }

    return prog;
}
