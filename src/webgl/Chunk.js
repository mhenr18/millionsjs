var Immy = require('immy');

export default class Chunk {

    constructor (firstLine, costFunc) {
        if (costFunc == null) {
            costFunc = function () { return [0]; }
        }

        this.lines = new Immy.List([firstLine]);
        this.costFunc = costFunc;
    }

    costs() {
        var totalCosts = [];

        this.lines.forEach(function (line) {
            var lineCosts = this.costFunc(line);

            while (lineCosts.length > totalCosts.length) {
                totalCosts.push(0);
            }

            for (let i = 0; i < lineCosts.length; ++i) {
                totalCosts[i] += lineCosts[i];
            }
        });

        return totalCosts;
    }

    split() {
        if (this.size() == 1) {
            throw new Error("Can't split a chunk with only one line in it");
        }

        let beginA = 0;
        let beginB = (this.size() / 2) | 0;

        let a = new Chunk(null, this.costFunc);
        a.lines = this.lines.slice(0, beginB);

        let b = new Chunk(null, this.costFunc);
        b.lines = this.lines.slice(beginB, this.size());

        return [a, b];
    }

    size() {
        return this.lines.size();
    }

    firstHandle() {
        return this.lines.get(0).handle;
    }

    lastHandle() {
        return this.lines.get(this.lines.size() - 1).handle;
    }

    // fast path just for inserting lines we know will sit at the end
    withLineAppended(line) {
        let newChunk = new Chunk(null, this.costFunc);
        newChunk.lines = this.lines.push(line);
        return newChunk;
    }

    // slow path which can be used to insert lines at any part of the chunk
    withLineAdded(line) {
        // look for the first handle that's bigger than the line's handle
        let i = this.lines.findIndex(l => l.handle > line.handle);
        if (i == -1) {
            i = this.lines.size();
        }

        // that becomes our insertion point, as everything at or after the index
        // just gets moved up by one
        let newChunk = new Chunk(null, this.costFunc);
        newChunk.lines = this.lines.splice(i, 0, line);

        return newChunk;
    }

    boundingBox() {
        var minX = Number.MAX_VALUE;
        var minY = Number.MAX_VALUE;
        var maxX = Number.MIN_VALUE;
        var maxY = Number.MIN_VALUE;

        this.lines.forEach(function (line) {
            minX = Math.min(line.p1.x, minX);
            minX = Math.min(line.p2.x, minX);
            minY = Math.min(line.p1.y, minY);
            minY = Math.min(line.p2.y, minY);

            maxX = Math.max(line.p1.x, maxX);
            maxX = Math.max(line.p2.x, maxX);
            maxY = Math.max(line.p1.y, maxY);
            maxY = Math.max(line.p2.y, maxY);
        });

        return {
            x: minX,
            y: minY,
            width: maxX - minX,
            height: maxY - minY
        };
    }
}
