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

function genCap(point, ux, uy, v1i, v2i, pushVert, pushIndices) {
    if (!point.cap) {
        genRoundedCap(point, ux, uy, v1i, v2i, pushVert, pushIndices);
    } else {
        switch (point.cap.type) {
            case LineCaps.LINECAP_TYPE_ARROW:
                genArrowCap(point, ux, uy, v1i, v2i, pushVert, pushIndices);
                break;

            case LineCaps.LINECAP_TYPE_ROUNDED:
                genRoundedCap(point, ux, uy, v1i, v2i, pushVert, pushIndices);
                break;

            case LineCaps.LINECAP_TYPE_HALF_ARROW_A:
                genHalfArrowACap(point, ux, uy, v1i, v2i, pushVert, pushIndices);
                break;

            default:
                // default to no cap
                break;
        }
    }
}

function genRoundedCap(point, ux, uy, v1i, v2i, pushVert, pushIndices) {
    var x = point.x;
    var y = point.y;

    var rx = -uy;
    var ry = ux;
    var radius = point.thickness / 2;

    // this normal is special because it's not a unit normal. it's designed
    // to be a unit out both in the direction of the line normals, and also in
    // the direction of the line. (i.e its length is not 1, but sqrt(2))
    var n3x = ux + rx;
    var n3y = uy + ry;
    var n3len = Math.sqrt(n3x*n3x + n3y*n3y);
    n3x = (n3x / n3len) * 1.414213;
    n3y = (n3y / n3len) * 1.414213;

    var n4x = ux - rx;
    var n4y = uy - ry;
    var n4len = Math.sqrt(n4x*n4x + n4y*n4y);
    n4x = (n4x / n4len) * 1.414213;
    n4y = (n4y / n4len) * 1.414213;

    //  3  2
    //
    //  4  1

    var v3i = pushVert(x + ux + rx, y + uy + ry, x, y, radius, n3x, n3y, 0, 0, point.color);
    var v4i = pushVert(x + ux - rx, y + uy - ry, x, y, radius, n4x, n4y, 0, 0, point.color);

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

    // when we make the unit vector, make it a "line unit" where it's
    // half as long as the line's thickness at that endpoint
    const u1x = (dx / length) * radius1,
          u1y = (dy / length) * radius1,
          u2x = (dx / length) * radius2,
          u2y = (dy / length) * radius2;

    // rotate it to be normal to the line segment
    const r1x = -u1y,
          r1y = u1x,
          r2x = -u2y,
          r2y = u2x;

    var n1x = r1x / radius1,
        n1y = r1y / radius1,
        n2x = r2x / radius2,
        n2y = r2y / radius2;

    const v1i = pushVert(x1 + r1x, y1 + r1y, x1, y1, radius1, n1x, n1y, 0, 0, line.p1.color),
          v2i = pushVert(x2 + r2x, y2 + r2y, x2, y2, radius2, n2x, n2y, 0, 0, line.p2.color),
          v3i = pushVert(x2 - r2x, y2 - r2y, x2, y2, radius2, -n2x, -n2y, 0, 0, line.p2.color),
          v4i = pushVert(x1 - r1x, y1 - r1y, x1, y1, radius1, -n1x, -n1y, 0, 0, line.p1.color);

    pushIndices(
        v1i, v2i, v3i,
        v1i, v3i, v4i
    );

    // now we can look at the endcaps
    genCap(line.p1, -u1x, -u1y, v1i, v4i, pushVert, pushIndices);
    genCap(line.p2, u2x, u2y, v3i, v2i, pushVert, pushIndices);
}

function genTriangle(triangle, pushVert, pushIndices) {
    var n1 = getOutwardNormal(triangle.p1, triangle.p2, triangle.p3);
    var n2 = getOutwardNormal(triangle.p2, triangle.p3, triangle.p1);
    var n3 = getOutwardNormal(triangle.p3, triangle.p1, triangle.p2);

    var bu1 = getBarycentricDistance(triangle.p1, triangle.p2, triangle.p3);
    var bu2 = getBarycentricDistance(triangle.p2, triangle.p3, triangle.p1);
    var bu3 = getBarycentricDistance(triangle.p3, triangle.p1, triangle.p2);

    var v1i = pushVert(triangle.p1.x, triangle.p1.y, triangle.p1.x, triangle.p1.y, 0.0, n1.x, n1.y, 2, bu1, triangle.p1.color);
    var v2i = pushVert(triangle.p2.x, triangle.p2.y, triangle.p2.x, triangle.p2.y, 0.0, n2.x, n2.y, 3, bu2, triangle.p2.color);
    var v3i = pushVert(triangle.p3.x, triangle.p3.y, triangle.p3.x, triangle.p3.y, 0.0, n3.x, n3.y, 5, bu3, triangle.p3.color);

    pushIndices(v1i, v2i, v3i);
}
