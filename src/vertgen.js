
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

export function genLine(line, pushVert, pushIndices) {
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
    const u1x = (dx / length) * radius1 * 1.1,
          u1y = (dy / length) * radius1 * 1.1,
          u2x = (dx / length) * radius2 * 1.1,
          u2y = (dy / length) * radius2 * 1.1;

    // rotate it to be normal to the line segment
    const r1x = -u1y,
          r1y = u1x,
          r2x = -u2y,
          r2y = u2x;

    // subtract the unit from our first point to get its outer
    // cap point, and add it to the second to get its one as well
    const cx1 = x1 - u1x,
          cy1 = y1 - u1y,
          cx2 = x2 + u2x,
          cy2 = y2 + u2y;

    // with these four points, we can add/subtract the rotated unit
    // vector to get the vertex positions.

    const v1i = pushVert(cx1 + r1x, cy1 + r1y, x1, y1, radius1, line.p1.color),
          v2i = pushVert(x1 + r1x, y1 + r1y, x1, y1, radius1, line.p1.color),
          v3i = pushVert(x2 + r2x, y2 + r2y, x2, y2, radius2, line.p2.color),
          v4i = pushVert(cx2 + r2x, cy2 + r2y, x2, y2, radius2, line.p2.color),
          v5i = pushVert(cx2 - r2x, cy2 - r2y, x2, y2, radius2, line.p2.color),
          v6i = pushVert(x2 - r2x, y2 - r2y, x2, y2, radius2, line.p2.color),
          v7i = pushVert(x1 - r1x, y1 - r1y, x1, y1, radius1, line.p1.color),
          v8i = pushVert(cx1 - r1x, cy1 - r1y, x1, y1, radius1, line.p1.color);

    // to refresh on the vertex layout:
    // 8  7    6  5
    //
    // 1  2    3  4
    pushIndices(
        v1i, v2i, v7i,
        v1i, v7i, v8i,
        v2i, v3i, v6i,
        v2i, v6i, v7i,
        v3i, v4i, v5i,
        v3i, v5i, v6i
    );
}
