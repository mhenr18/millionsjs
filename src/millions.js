const Color = require('./Color');
const Line = require('./Line');
const Chunk = require('./Chunk');
const WebGLRenderer = require('./WebGLRenderer');

const defaultOptions = {
    backgroundColor: Color.Transparent,
    pixelDensity: window.devicePixelRatio || 1
};

function getClosestChunkToHandle(lineHandle, chunks) {
    let closestChunkIndex = -1;
    let closestChunkDistance = Number.MAX_VALUE;

    for (let i = 0; i < chunks.length; ++i) {
        let chunk = chunks[i];
        let firstDist = Math.abs(chunk.firstHandle() - line.Handle);
        if (firstDist < closestChunkDistance) {
            closestChunkIndex = i;
            closestChunkDistance = firstDist;
            continue; // no need to calc the last dist if we're closest
        }

        let lastDist = Math.abs(chunk.lastHandle() - lineHandle);
        if (lastDist < closestChunkDistance) {
            closestChunkIndex = i;
            closestChunkDistance = lastDist;
        }
    }

    return closestChunkIndex;
}

export default class Millions {
    constructor(canvas, options = {}) {
        // create an object and assign the defaults to it, before then assigning
        // any options supplied as arguments
        this.options = Object.assign(Object.assign({}, defaultOptions), options);

        this.nextLineHandle = 0;
        this.chunks = [];
        this.renderer = new WebGLRenderer(canvas);
    }

    /**
     * You can provide the handle of a line that has been removed in order to
     * re-add a line at that point (as Millions renders in draw order, this is
     * required for undo/redo to work and behave as expected).
     */
    addLine(options) {
        const chunks = this.chunks;

        let line = new Line(options);

        if (options.hasOwnProperty('handle')) {
            // caller wants to reuse a handle, see if we can do it

            if (line.handle >= this.nextLineHandle) {
                // you can't reuse a handle that we haven't come up with yet
                throw new Error('cant re-use handle that was never used');
            }

            // just find the chunk whose first/last handle is the closest to
            // our target. this will always be the most appropriate chunk.
            let closestChunkIndex = getClosestChunkToHandle(line.handle, chunks);
            this._addLineToChunk(line, closestChunkIndex);
        } else {
            // new line, append to the newest chunk
            line.handle = this.nextLineHandle++;

            if (chunks.length == 0 || chunks[chunks.length - 1].isFull()) {
                console.log('creating new chunk');
                chunks.push(new Chunk(line));
            } else {
                chunks[chunks.length - 1].appendLine(line);
            }
        }

        return line.handle;
    }

    /**
     * Updates an already existing line
     */
    updateLine(lineHandle, newOptions) {
        this.chunks[this._findChunkIndex(lineHandle)].updateLine(newOptions);
    }

    removeLine(lineHandle) {
        let chunkIndex = this._findChunkIndex(lineHandle);
        let chunk = this.chunks[chunkIndex];

        chunk.removeLine(lineHandle);

        if (chunk.size() == 0) {
            this.chunks.slice(chunkIndex, 1);
        }
    }

    clientToGlobal(client, focalPoint, zoom) {
        let focalClientX = this.renderer.gl.canvas.clientWidth / 2;
        let focalClientY = this.renderer.gl.canvas.clientHeight / 2;

        return {
            x: (client.x - focalClientX) / zoom,
            y: (client.y - focalClientY) / zoom
        };
    }

    render(focalPoint, zoom, extraLines) {
        // TODO: implement this properly
        let extraLineHandles = [];
        if (extraLines) {
            for (let el of extraLines) {
                extraLineHandles.push(this.addLine(el));
            }
        }

        this.renderer.render(this.chunks, this.options.pixelDensity,
                             this.options.backgroundColor, focalPoint, zoom);

        extraLineHandles.forEach(lh => this.removeLine(lh));
    }

    _findChunkIndex(lineHandle) {
        // TODO: use a binary search of some sort
        return this.chunks.findIndex(c => c.firstHandle() <= lineHandle
                                     && lineHandle <= c.lastHandle());
    }



    // adds a line to a chunk, splitting it into two if it's full
    _addLineToChunk(line, chunkIndex) {
        const chunks = this.chunks;

        if (chunks[chunkIndex].isFull()) {
            // split it half into two new chunks. we then insert into the most
            // appropriate half.
            let halves = chunks[chunkIndex].split();
            let halfIndex = getClosestChunkToHandle(line.handle, halves);
            halves[halfIndex].addLine(line);

            chunks.splice(chunkIndex, 1, halves[0], halves[1]);
        } else {
            // we're golden, can just directly add the line
            chunks[chunkIndex].addLine(line);
        }
    }
}

Millions.Color = Color;
Millions.Line = Line;
