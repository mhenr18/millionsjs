var LineCaps = require('../entities/LineCaps');
var Line = require('../entities/Line');
var Color = require('../Color');

//
//
// our aim is to end up with 8 vertices (marked as V and
// numbered), for rendering the line going from P1 to P2.
//
//  8           7                        6           5
//  V-----------V------------------------V-----------V
//  |                                                |
//  |                                                |
//  |           P1----------------------P2           |
//  |                                                |
//  |                                                |
//  V-----------V------------------------V-----------V
//  1           2                        3           4
//
// each vertex has a position as well as a "closest point on
// the line" position. for verts 1,2,7,8 that will be P1. for
// the others, it's P2.
//
// we can then use the fragment shader to fill lines that fit
// within thickness / 2 pixels of the closest point, to give us
// a line segment with rounded caps. using the technique from
// https://www.mapbox.com/blog/drawing-antialiased-lines/ we can
// also antialias those lines.


// capgen shouldn't push more than two verts and 6 indices

function genCap(point, aaFactor, ux, uy, v1i, v2i, pushVert, pushIndices) {
    if (!point.cap) {
        genRoundedCap(point, aaFactor, ux, uy, v1i, v2i, pushVert, pushIndices);
    } else {
        switch (point.cap.type) {
            case LineCaps.LINECAP_TYPE_ARROW:
                genArrowCap(point, aaFactor, ux, uy, v1i, v2i, pushVert, pushIndices);
                break;

            case LineCaps.LINECAP_TYPE_ROUNDED:
                genRoundedCap(point, aaFactor, ux, uy, v1i, v2i, pushVert, pushIndices);
                break;

            case LineCaps.LINECAP_TYPE_HALF_ARROW_A:
                genHalfArrowCap(point, aaFactor, ux, uy, v1i, v2i, pushVert, pushIndices);
                break;

            default:
                // default to no cap
                break;
        }
    }
}

function genArrowCap(point, aaFactor, ux, uy, _1, _2, pushVert, pushIndices) {
    var x = point.x;
    var y = point.y;
    var radius = point.thickness / 2;

    var rx = -uy;
    var ry = ux;

    ux *= point.cap.lengthScale;
    uy *= point.cap.lengthScale;

    //     2
    //  3
    //     1

    var v1i = pushVert(x - rx * aaFactor, y - ry * aaFactor,
                       x - rx, y - ry, 0, point.color);

    var v2i = pushVert(x + rx * aaFactor, y + ry * aaFactor,
                       x + rx, y + ry, 0, point.color);

    var v3i = pushVert(x + ux * aaFactor, y + uy * aaFactor,
                       x + ux, y + uy, 0, point.color);

    pushIndices(v1i, v2i, v3i);
}

function genHalfArrowCap(point, aaFactor, ux, uy, v1i, v2i, pushVert, pushIndices) {
    // we use one of the existing verts and generate two of our own - this allows
    // us to have a parameterised width
    var x = point.x;
    var y = point.y;

    ux *= point.cap.lengthScale * aaFactor;
    uy *= point.cap.lengthScale * aaFactor;

    var rx = -uy;
    var ry = ux;
    var radius = point.thickness / 2;

    //  note that we ignore 2, and conceptually 3 is in its place but can be
    //  extended out along that normal.
    //
    //     3
    //
    //  4  1

    //var v3i = pushVert(x + rx, y + ry, x, y, radius, Color.fromRGB(0, 255, 0));
    var v4i = pushVert(x + ux + rx, y + uy + ry,
        x + (rx + ux) / aaFactor, y + (ry + uy) / aaFactor,
        radius, Color.fromRGB(0, 0, 255));

    pushIndices(v1i, v2i, v4i);
}

function genRoundedCap(point, aaFactor, ux, uy, v1i, v2i, pushVert, pushIndices) {
    var x = point.x;
    var y = point.y;

    ux *= aaFactor;
    uy *= aaFactor;

    var rx = -uy;
    var ry = ux;
    var radius = point.thickness / 2;

    //  3  2
    //
    //  4  1

    var v3i = pushVert(x + ux + rx, y + uy + ry, x, y, radius, point.color);
    var v4i = pushVert(x + ux - rx, y + uy - ry, x, y, radius, point.color);

    pushIndices(
        v4i, v1i, v2i,
        v4i, v2i, v3i
    );
}

function genLine(line, pushVert, pushIndices) {
    const x1 = line.p1.x, y1 = line.p1.y,
          x2 = line.p2.x, y2 = line.p2.y;

    // get a unit vector for the line (from p1 to p2)
    const dx = x2 - x1,
          dy = y2 - y1;

    let length = Math.sqrt(dx*dx + dy*dy);
    if (length == 0) {
        length = 0.001; // stop divides by zero
    }

    const radius1 = line.p1.thickness / 2,
          radius2 = line.p2.thickness / 2;

    const aaFactor = 3;

    // when we make the unit vector, make it a "line unit" where it's
    // half as long as the line's thickness at that endpoint
    const u1x = (dx / length) * radius1 * aaFactor,
          u1y = (dy / length) * radius1 * aaFactor,
          u2x = (dx / length) * radius2 * aaFactor,
          u2y = (dy / length) * radius2 * aaFactor;

    // rotate it to be normal to the line segment
    const r1x = -u1y,
          r1y = u1x,
          r2x = -u2y,
          r2y = u2x;

    // with these four points, we can add/subtract the rotated unit
    // vector to get the vertex positions. we push the core vertex positions and
    // their indices.
    const v1i = pushVert(x1 + r1x, y1 + r1y, x1, y1, radius1, line.p1.color),
          v2i = pushVert(x2 + r2x, y2 + r2y, x2, y2, radius2, line.p2.color),
          v3i = pushVert(x2 - r2x, y2 - r2y, x2, y2, radius2, line.p2.color),
          v4i = pushVert(x1 - r1x, y1 - r1y, x1, y1, radius1, line.p1.color);

    pushIndices(
        v1i, v2i, v3i,
        v1i, v3i, v4i
    );

    // now we can look at the endcaps
    genCap(line.p1, aaFactor, -u1x / aaFactor, -u1y / aaFactor, v1i, v4i, pushVert, pushIndices);
    genCap(line.p2, aaFactor, u2x / aaFactor, u2y / aaFactor, v3i, v2i, pushVert, pushIndices);
}

// TODO: optimize this so we don't actually have to vertgen each time
export function costOf(entity) {
    var numVerts = 0;
    var numIndices = 0;

    function pushVert() {
        return numVerts++;
    }

    function pushIndices() {
        numIndices += arguments.length;
    }

    generate(entity, pushVert, pushIndices);

    return {
        verts: numVerts,
        indices: numIndices
    };
}

export function generate(entity, pushVert, pushIndices) {
    if (entity instanceof Line) {
        genLine(entity, pushVert, pushIndices);
    } else {
        throw new Error("don't know about this entity type");
    }
}
