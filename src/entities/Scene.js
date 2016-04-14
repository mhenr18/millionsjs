//var Chunk = require('./Chunk');
var Color = require('../Color');
var Immy = require('immy');

//function getClosestChunkToHandle(lineHandle, chunks) {
//    let closestChunkIndex = -1;
//    let closestChunkDistance = Number.MAX_VALUE;
//
//    chunks.forEach(function (chunk, i) {
//        let firstDist = Math.abs(chunk.firstHandle() - line.Handle);
//        if (firstDist < closestChunkDistance) {
//            closestChunkIndex = i;
//            closestChunkDistance = firstDist;
//            return; // no need to calc the last dist if we're closest
//        }
//
//        let lastDist = Math.abs(chunk.lastHandle() - lineHandle);
//        if (lastDist < closestChunkDistance) {
//            closestChunkIndex = i;
//            closestChunkDistance = lastDist;
//        }
//    });
//
//    return closestChunkIndex;
//}

// scenes are collections of entities (things like lines, circles, triangles).
// entities have various properties, and can be rendered.

export default class Scene {

    constructor() {
        this.entities = new Immy.List();
        this.bgColor = Color.fromRGB(255, 255, 255);
    }

    __clone() {
        return Object.assign(new Scene(), {
            entities: this.entities,
            bgColor: this.bgColor
        });
    }

    withBackgroundColor(color) {
        return Object.assign(this.__clone(), {
            bgColor: color
        });
    }

    boundingBox() {
        if (this.entities.size() == 0) {
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

        this.entities.forEach(function (entity) {
            var bb = entity.boundingBox();

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

    withEntityAdded(entity) {
        // binary search the entities list on zIndex to figure out where to insert
        var index = this.entities.findInsertionIndexWithBinarySearch(function (existing) {
            return existing.zIndex - entity.zIndex;
        });

        if (index < this.entities.size() && this.entities.get(index).zIndex == entity.zIndex) {
            throw new Error('entities cannot have identical z indices');
        }

        // and return a version of the scene with it inserted at that position
        return Object.assign(this.__clone(), {
            entities: this.entities.withValueAdded(index, entity)
        });
    }

    // returns a new scene with everything in between the half open range
    // [zBegin, zEnd) removed. (half open means that anything with a zIndex
    // equal to zEnd will *not* be removed, but anything equal to zBegin *will*
    // be removed)
    withEntitiesInZIndexRangeRemoved(zBegin, zEnd) {
        // find our starting index
        var beginIndex = this.entities.findInsertionIndexWithBinarySearch(function (existing) {
            return existing.zIndex - zBegin;
        });

        // beginIndex might be slightly ahead, seek back until we know it's not
        while (beginIndex > 0 && this.entities.get(beginIndex - 1).zIndex >= zBegin) {
            --beginIndex;
        }

        // now just seek forward and remove
        var numRemoved = 0;
        var entities = this.entities;
        while (beginIndex < entities.size() && entities.get(beginIndex).zIndex < zEnd) {
            entities = entities.withValueRemoved(beginIndex);
            ++numRemoved;
        }

        return Object.assign(this.__clone(), {
            entities: entities
        });
    }

    // returns a ListPatch, but you should ignore the indexes and just care about
    // the values and whether they're added or removed
    //
    // TODO: rewrite this somehow to return something more meaningful
    compareTo(otherScene) {
        return this.entities.compareTo(otherScene.entities, {
            ordered: true,
            comparison: function (a, b) {
                if (a.equals(b)) {
                    return 0;
                } else {
                    if (a.zIndex == b.zIndex) {
                        // same z index but we aren't equal, return null for a
                        // replacement
                        return null;
                    } else {
                        return a.zIndex - b.zIndex;
                    }
                }
            }
        });
    }

    //withLineAdded(p1, p2, handle) {
    //    const chunks = this.chunks;
    //    let line = new Line(p1, p2);
//
    //    if (handle !== undefined) {
    //        // caller wants to reuse a handle, see if we can do it
    //        line.handle = handle;
//
    //        if (line.handle >= this.nextLineHandle) {
    //            // you can't reuse a handle that we haven't come up with yet
    //            throw new Error('cant re-use handle that was never used');
    //        }
//
    //        // just find the chunk whose first/last handle is the closest to
    //        // our target. this will always be the most appropriate chunk.
    //        // we don't call chunk.withLineAdded directly because the chunk may
    //        // be full and we'll have to split it
    //        let closestChunkIndex = getClosestChunkToHandle(line.handle, chunks);
    //        return this.__withLineAddedToChunk(line, closestChunkIndex);
    //    } else {
    //        // new line, append to the newest chunk
    //        line.handle = this.nextLineHandle;
//
    //        var newStore = this.__clone();
    //        newStore.nextLineHandle = this.nextLineHandle + 1;
    //        newStore.addedLineHandle = line.handle;
//
    //        if (chunks.size() == 0 || chunks.get(chunks.size() - 1).isFull()) {
    //            console.log('creating new chunk');
    //            newStore.chunks = chunks.push(new Chunk(line));
    //        } else {
    //            newStore.chunks = chunks.withMutation(chunks.size() - 1, function (chunk) {
    //                return chunk.withLineAppended(line)
    //            });
    //        }
//
    //        return newStore;
    //    }
    //}.
//
    //__withLineAddedToChunk(line, chunkIndex) {
    //    let chunks = this.chunks;
//
    //    if (chunks[chunkIndex].isFull()) {
    //        // split it half into two new chunks. we then insert into the most
    //        // appropriate half.
    //        let halves = chunks[chunkIndex].split();
    //        let halfIndex = getClosestChunkToHandle(line.handle, halves);
    //        halves[halfIndex] = halves[halfIndex].withLineAdded(line);
//
    //        chunks = chunks.splice(chunkIndex, 1, halves[0], halves[1]);
    //    } else {
    //        // we're golden, can just directly add the line
    //        chunks = chunks.withMutation(chunkIndex, function (chunk) {
    //            return chunk.withLineAdded(line);
    //        });
    //    }
//
    //    let newStore = this.__clone();
    //    newStore.chunks = chunks;
//
    //    return newStore;
    //}

}
