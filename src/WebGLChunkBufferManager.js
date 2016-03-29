let Chunk = require('./Chunk');
let vertgen = require('./vertgen');

class ChunkBuffer {
    constructor(gl) {
        this.vbo = null;
        this.ibo = null;
        this.chunk = null;
        this.vboData = null;
        this.iboData = null;
        this.numVerts = 0;
        this.numIndices = 0;
    }

    allocate(gl) {
        try {
            const vboDataSize = Chunk.MAX_SIZE * 8 * 24;
            const iboDataSize = Chunk.MAX_SIZE * 18 * 2;

            this.vbo = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
            gl.bufferData(gl.ARRAY_BUFFER, vboDataSize, gl.DYNAMIC_DRAW);

            this.ibo = gl.createBuffer();
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ibo);
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, iboDataSize, gl.DYNAMIC_DRAW);

            this.vboData = new ArrayBuffer(vboDataSize);
            this.iboData = new ArrayBuffer(iboDataSize);
        } catch (ex) {
            console.log('ChunkBuffer.allocate caught ex', ex);

            if (this.vbo) {
                gl.deleteBuffer(this.vbo);
                this.vbo = null;
            }

            if (this.ibo) {
                gl.deleteBuffer(this.ibo);
                this.ibo = null;
            }

            return false;
        }

        return true;
    }
}

// manager has a LRU list of buffers
// it also has a list of free buffers


export default class WebGLChunkBufferManager {
    constructor(gl) {
        this.gl = gl;
        this.freeBuffers = [];
        this.usedBuffers = []; // LRU cache, most recent is always at the back
    }

    getBufferForChunk(chunk, upcomingChunks) {
        // do any of the buffers in use refer to this chunk?
        let buffer = null;
        let bufferIndex = this.usedBuffers.findIndex((b) => b.chunk == chunk);
        if (bufferIndex != -1) {
            // yep, pull it out of the LRU
            return this.usedBuffers.splice(bufferIndex, 1)[0];
        } else {
            // nope, just get one
            buffer = this._getBuffer(upcomingChunks);
        }

        // put our buffer into the LRU in the most recently used spot
        this.usedBuffers.push(buffer);

        // differing render states, need to update our buffer
        this._vertGenChunk(chunk, buffer);
        buffer.chunk = chunk;
        return buffer;
    }

    _getBuffer(upcomingChunks) {
        let buffer = null;

        // always prefer to just allocate a new buffer
        buffer = this._allocBuffer();
        if (buffer) {
            return buffer;
        }

        // anything on the free list is now game
        if (this.freeBuffers.length > 0) {
            return this.freeBuffers.pop();
        }

        // no free buffers and we can't allocate one - time to yank one that's
        // in use
        return this._stealBufferInUse(upcomingChunks);
    }

    _allocBuffer() {
        let numAllocated = this.freeBuffers.length + this.usedBuffers.length;
        if (numAllocated >= WebGLChunkBufferManager.MAX_BUFFERS) {
            return null;
        }

        let buffer = new ChunkBuffer();
        if (!buffer.allocate(this.gl)) {
            return null;
        }

        return buffer;
    }

    _stealBufferInUse(upcomingChunks) {
        // work our way through the LRU until we find the first buffer that
        // isn't in the upcoming chunks
        for (let i = 0; i < this.usedBuffers.length; ++i) {
            let buffer = this.usedBuffers[i];

            // if we can find this buffer's chunk in the upcoming ones, then
            // keep looking through the used buffers
            if (upcomingChunks.find((c) => c == buffer.chunk)) {
                continue;
            }

            // couldn't find the buffer's chunk in upcoming, it's good to steal
            return this.usedBuffers.splice(i, 1)[0];
        }

        // every chunk is upcoming, so work backwards through the upcoming
        // chunks and free up the one that's coming closest to the end
        for (let i = upcomingChunks.length - 1; i >= 0; --i) {
            let chunk = upcomingChunks[i];

            // find any buffer that's associated with that chunk
            let bufferIndex = this.usedBuffers.findIndex(
                                                (b) => b.chunk == chunk);

            return this.usedBuffers.splice(bufferIndex, 1)[0];
        }

        // worst case, just steal the least most recently used buffer
        return this.usedBuffers.shift();
    }

    _vertGenChunk(chunk, buffer) {
        const gl = this.gl;
        const vboFloatView = new Float32Array(buffer.vboData);
        const vboByteView = new Uint8Array(buffer.vboData);
        const iboUint16View = new Uint16Array(buffer.iboData);

        buffer.numVerts = 0;
        buffer.numIndices = 0;

        let pushVert = (x, y, lx, ly, r, color) => {
            const floatBase = 6 * buffer.numVerts;
            const byteBase = 24 * buffer.numVerts;

            vboFloatView[floatBase] = x;
            vboFloatView[floatBase + 1] = y;
            vboFloatView[floatBase + 2] = lx;
            vboFloatView[floatBase + 3] = ly;
            vboFloatView[floatBase + 4] = r;
            vboByteView[byteBase + 20] = color.r;
            vboByteView[byteBase + 21] = color.g;
            vboByteView[byteBase + 22] = color.b;
            vboByteView[byteBase + 23] = color.a;

            return buffer.numVerts++;
        };

        let pushIndex = (vert) => {
            iboUint16View[buffer.numIndices++] = vert;
        };

        let pushIndices = (...verts) => {
            for (let v of verts) {
                pushIndex(v);
            }
        }

        chunk.lines.__getBuffer();
        for (let line of chunk.lines.buffer) {
            vertgen.genLine(line, pushVert, pushIndices);
        }

        gl.bindBuffer(gl.ARRAY_BUFFER, buffer.vbo);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer.ibo);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, new Uint8Array(buffer.vboData, 0, buffer.numVerts * 24));
        gl.bufferSubData(gl.ELEMENT_ARRAY_BUFFER, 0, new Uint8Array(buffer.iboData, 0, buffer.numIndices * 2));
    }
}

WebGLChunkBufferManager.MAX_BUFFERS = 256;
