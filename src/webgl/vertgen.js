var Line = require('../entities/Line');
var Triangle = require('../entities/Triangle');
var LineCaps = require('../entities/LineCaps');

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
    } else if (entity instanceof Triangle) {
        genTriangle(entity, pushVert, pushIndices);
    } else {
        throw new Error("don't know about this entity type");
    }
}

function getOutwardNormal(p, a, b) {
    var v1x = a.x - p.x;
    var v1y = a.y - p.y;
    var v2x = b.x - p.x;
    var v2y = b.y - p.y;
    var v3x = v1x + v2x;
    var v3y = v1y + v2y;

    v3x *= -1;
    v3y *= -1;

    var dist = Math.sqrt(v3x*v3x + v3y*v3y);
    return {
        x: v3x / dist,
        y: v3y / dist
    };
}

function getBarycentricDistance(p, a, b) {
    // distance from p to avg of a and b
    var epx = (a.x + b.x) / 2;
    var epy = (a.y + b.y) / 2;
    var dx = epx - p.x;
    var dy = epy - p.y;

    return Math.sqrt(dx*dx + dy*dy);
}

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

    var v3i = pushVert(x + ux + rx, y + uy + ry, x, y, radius, 0, 0, 0, 0, point.color);
    var v4i = pushVert(x + ux - rx, y + uy - ry, x, y, radius, 0, 0, 0, 0, point.color);

    pushIndices(
        v4i, v1i, v2i,
        v4i, v2i, v3i
    );
}

function genArrowCap(point, aaFactor, ux, uy, v1i, v2i, pushVert, pushIndices) {
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

    var p1 = {
        x: x - rx,
        y: y - ry
    };

    var p2 = {
        x: x + rx,
        y: y + ry
    };

    var p3 = {
        x: x + ux,
        y: y + uy
    };

    var nx = rx / radius;
    var ny = ry / radius;

    var n1 = getOutwardNormal(p1, p2, p3);
    var n2 = getOutwardNormal(p2, p3, p1);
    var n3 = getOutwardNormal(p3, p1, p2);

    var bu1 = getBarycentricDistance(p1, p2, p3);
    var bu2 = getBarycentricDistance(p2, p3, p1);
    var bu3 = getBarycentricDistance(p3, p1, p2);

    var v1i = pushVert(p1.x, p1.y, 0, 0, 0, n1.x, n1.y, 2, bu1, point.color);
    var v2i = pushVert(p2.x, p2.y, 0, 0, 0, n2.x, n2.y, 3, bu2, point.color);
    var v3i = pushVert(p3.x, p3.y, 0, 0, 0, n3.x, n3.y, 5, bu3, point.color);

    pushIndices(v1i, v2i, v3i);
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

    //var n1x = r1x / (radius1 * aaFactor),
    //    n1y = r1y / (radius1 * aaFactor),
    //    n2x = r2x / (radius2 * aaFactor),
    //    n2y = r2y / (radius2 * aaFactor);
//
    //var p1 = {x: x1 + r1x, y: y1 + r1y};
    //var p2 = {x: x2 + r2x, y: y2 + r2y};
    //var p3 = {x: x2 - r2x, y: y2 - r2y};
    //var p4 = {x: x1 - r1x, y: y1 - r1y};
//
    //var bu1 = getBarycentricDistance(p1, p3, p4);
    //var bu2 = getBarycentricDistance(p3, p4, p1);
    //var bu3 = getBarycentricDistance(p4, p1, p3);
//
    //const v1i = pushVert(x1 + r1x, y1 + r1y, 0, 0, 0, n1x, n1y, 2, bu1, line.p1.color);
    //const v2i = pushVert(x2 + r2x, y2 + r2y, 0, 0, 0, n2x, n2y, 5, bu3, line.p2.color);
    //const v3i = pushVert(x2 - r2x, y2 - r2y, 0, 0, 0, -n2x, -n2y, 3, bu2, line.p2.color);
    //const v4i = pushVert(x1 - r1x, y1 - r1y, 0, 0, 0, -n1x, -n1y, 5, bu3, line.p1.color);

    const v1i = pushVert(x1 + r1x, y1 + r1y, x1, y1, radius1, 0, 0, 0, 0, line.p1.color),
          v2i = pushVert(x2 + r2x, y2 + r2y, x2, y2, radius2, 0, 0, 0, 0, line.p2.color),
          v3i = pushVert(x2 - r2x, y2 - r2y, x2, y2, radius2, 0, 0, 0, 0, line.p2.color),
          v4i = pushVert(x1 - r1x, y1 - r1y, x1, y1, radius1, 0, 0, 0, 0, line.p1.color);

    pushIndices(
        v1i, v2i, v3i,
        v1i, v3i, v4i
    );

    // now we can look at the endcaps
    genCap(line.p1, aaFactor, -u1x / aaFactor, -u1y / aaFactor, v1i, v4i, pushVert, pushIndices);
    genCap(line.p2, aaFactor, u2x / aaFactor, u2y / aaFactor, v3i, v2i, pushVert, pushIndices);
}

function genTriangle(triangle, pushVert, pushIndices) {
    var n1 = getOutwardNormal(triangle.p1, triangle.p2, triangle.p3);
    var n2 = getOutwardNormal(triangle.p2, triangle.p3, triangle.p1);
    var n3 = getOutwardNormal(triangle.p3, triangle.p1, triangle.p2);

    var bu1 = getBarycentricDistance(triangle.p1, triangle.p2, triangle.p3);
    var bu2 = getBarycentricDistance(triangle.p2, triangle.p3, triangle.p1);
    var bu3 = getBarycentricDistance(triangle.p3, triangle.p1, triangle.p2);

    var v1i = pushVert(triangle.p1.x, triangle.p1.y, 0, 0, 0, n1.x, n1.y, 2, bu1, triangle.p1.color);
    var v2i = pushVert(triangle.p2.x, triangle.p2.y, 0, 0, 0, n2.x, n2.y, 3, bu2, triangle.p2.color);
    var v3i = pushVert(triangle.p3.x, triangle.p3.y, 0, 0, 0, n3.x, n3.y, 5, bu3, triangle.p3.color);

    pushIndices(v1i, v2i, v3i);
}
