
// a BufferRegion maps values within a range of z indices to a given buffer. if
// a BufferRegion isn't marked, that means there's been no changes within that
// region and we get to reuse the buffer. if it has been marked, we need to regen
// everything in that range.
//
// we don't store a max index for regions (you can find the max by looking at the
// min of the next buffer, or it's Number.MAX_VALUE if there isn't a next buffer)
export default class BufferRegion {
    constructor(minIndex) {
        this.minIndex = minIndex;
        this.marked = false;
    }

    mark() {
        this.marked = true;
    }

    unmark() {
        this.marked = false;
    }

    isMarked() {
        return this.marked;
    }
}
