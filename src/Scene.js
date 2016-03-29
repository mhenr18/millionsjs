var Chunk = require('./Chunk');
var Color = require('./Color');
var Line = require('./Line');
var Immy = require('immy');

function getClosestChunkToHandle(lineHandle, chunks) {
    let closestChunkIndex = -1;
    let closestChunkDistance = Number.MAX_VALUE;

    chunks.forEach(function (chunk, i) {
        let firstDist = Math.abs(chunk.firstHandle() - line.Handle);
        if (firstDist < closestChunkDistance) {
            closestChunkIndex = i;
            closestChunkDistance = firstDist;
            return; // no need to calc the last dist if we're closest
        }

        let lastDist = Math.abs(chunk.lastHandle() - lineHandle);
        if (lastDist < closestChunkDistance) {
            closestChunkIndex = i;
            closestChunkDistance = lastDist;
        }
    });

    return closestChunkIndex;
}

export default class Scene {

    constructor() {
        this.chunks = new Immy.List();
        this.nextLineHandle = 0;
        this.bgColor = Color.fromRGB(255, 255, 255);
    }

    __clone() {
        var cpy = new Scene();
        cpy.chunks = this.chunks;
        cpy.nextLineHandle = this.nextLineHandle;
        cpy.bgColor = this.bgColor;

        return cpy;
    }

    withBackgroundColor(color) {
        var cpy = this.__clone();
        cpy.bgColor = color;

        return cpy;
    }

    boundingBox() {
        if (this.chunks.size() == 0) {
            return {
                x: -1,
                y: -1,
                width: 2,
                height: 2
            };
        }

        var minX = Number.MAX_VALUE;
        var minY = Number.MAX_VALUE;
        var maxX = Number.MIN_VALUE;
        var maxY = Number.MIN_VALUE;

        this.chunks.forEach(function (chunk) {
            var bb = chunk.boundingBox();

            minX = Math.min(bb.x, minX);
            minX = Math.min(bb.x + bb.width, minX);
            minY = Math.min(bb.y, minY);
            minY = Math.min(bb.y + bb.height, minY);

            maxX = Math.max(bb.x, maxX);
            maxX = Math.max(bb.x + bb.width, maxX);
            maxY = Math.max(bb.y, maxY);
            maxY = Math.max(bb.y + bb.height, maxY);
        });

        return {
            x: minX,
            y: minY,
            width: maxX - minX,
            height: maxY - minY
        };
    }

    // the returned store will have an `addedLineHandle` property that you can
    // use to get at the handle of the newly added line if you didn't specify
    // it yourself.
    withLineAdded(p1, p2, handle) {
        const chunks = this.chunks;
        let line = new Line(p1, p2);

        if (handle !== undefined) {
            // caller wants to reuse a handle, see if we can do it
            line.handle = handle;

            if (line.handle >= this.nextLineHandle) {
                // you can't reuse a handle that we haven't come up with yet
                throw new Error('cant re-use handle that was never used');
            }

            // just find the chunk whose first/last handle is the closest to
            // our target. this will always be the most appropriate chunk.
            // we don't call chunk.withLineAdded directly because the chunk may
            // be full and we'll have to split it
            let closestChunkIndex = getClosestChunkToHandle(line.handle, chunks);
            return this.__withLineAddedToChunk(line, closestChunkIndex);
        } else {
            // new line, append to the newest chunk
            line.handle = this.nextLineHandle;

            var newStore = this.__clone();
            newStore.nextLineHandle = this.nextLineHandle + 1;
            newStore.addedLineHandle = line.handle;

            if (chunks.size() == 0 || chunks.get(chunks.size() - 1).isFull()) {
                console.log('creating new chunk');
                newStore.chunks = chunks.push(new Chunk(line));
            } else {
                newStore.chunks = chunks.withMutation(chunks.size() - 1, function (chunk) {
                    return chunk.withLineAppended(line)
                });
            }

            return newStore;
        }
    }

    __withLineAddedToChunk(line, chunkIndex) {
        let chunks = this.chunks;

        if (chunks[chunkIndex].isFull()) {
            // split it half into two new chunks. we then insert into the most
            // appropriate half.
            let halves = chunks[chunkIndex].split();
            let halfIndex = getClosestChunkToHandle(line.handle, halves);
            halves[halfIndex] = halves[halfIndex].withLineAdded(line);

            chunks = chunks.splice(chunkIndex, 1, halves[0], halves[1]);
        } else {
            // we're golden, can just directly add the line
            chunks = chunks.withMutation(chunkIndex, function (chunk) {
                return chunk.withLineAdded(line);
            });
        }

        let newStore = this.__clone();
        newStore.chunks = chunks;

        return newStore;
    }

}
