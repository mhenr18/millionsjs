
export default class Chunk {

    constructor (firstLine) {
        this.id = Symbol('Chunk started with handle ' + firstLine.handle);
        //this.id = 10;
        this.lines = [ firstLine ];
        this.renderStateId = 0;
        this.boundingBox = null;
    }

    split() {
        if (this.size() == 1) {
            throw new Error("Can't split a chunk with only one line in it");
        }

        let beginA = 0;
        let beginB = (this.size() / 2) | 0;

        let a = new Chunk(this.lines[beginA]);
        a.lines = this.lines.slice(0, beginB);

        let b = new Chunk(this.lines[beginB]);
        b.lines = this.lines.slice(beginB, this.size());

        return [a, b];
    }

    size() {
        return this.lines.length;
    }

    firstHandle() {
        return this.lines[0].handle;
    }

    lastHandle() {
        return this.lines[this.lines.length - 1].handle;
    }

    // fast path for just adding new lines
    appendLine(line) {
        this.lines.push(line);
        this._invalidateRenderState();
    }

    // slow path which can be used to insert lines at any part of the chunk
    addLine(line) {
        let i = 0;

        // look for the first handle that's bigger than the line's handle
        for (i = 0; i < this.lines.length; ++i) {
            if (this.lines[i].handle > line.handle) {
                break;
            }
        }

        // that becomes our insertion point, as everything at or after the index
        // just gets moved up by one
        this.lines.splice(i, 0, line);
        this._invalidateRenderState();
    }

    updateLine(lineHandle, options) {
        let index = this._findLineIndex(lineHandle);
        this.lines[index].update(options);

        this._invalidateRenderState();
    }

    removeLine(lineHandle) {
        let index = this._findLineIndex(lineHandle);
        this.lines.splice(index, 1);
        this._invalidateRenderState();
    }

    isFull() {
        return this.lines.length == Chunk.MAX_SIZE;
    }

    // call to make sure the chunk is updated next time the renderer draws
    _invalidateRenderState() {
        ++this.renderStateId;
        this.boundingBox = null;
    }

    _getBoundingBox() {
        if (this.boundingBox == null) {
            let minX = this.lines[0].x1;
            let minY = this.lines[0].y1;
            let maxX = minX;
            let maxY = minY;

            for (let line of this.lines) {
                minX = Math.min(minX, line.x1);
                minX = Math.min(minX, line.x2);
                maxX = Math.max(maxX, line.x1);
                maxX = Math.max(maxX, line.x2);

                minY = Math.min(minY, line.y1);
                minY = Math.min(minY, line.y2);
                maxY = Math.max(maxY, line.y1);
                maxY = Math.max(maxY, line.y2);
            }

            this.boundingBox = {
                x: minX,
                y: minY,
                width: maxX - minX,
                height: maxY - minY
            };
        }

        return this.boundingBox;
    }

    _findLineIndex(handle) {
        // TODO: use binary search
        return this.lines.findIndex(l => l.handle == handle);
    }
}

Chunk.MAX_SIZE = 8192;
