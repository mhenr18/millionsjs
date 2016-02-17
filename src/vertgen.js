
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
    const x1 = line.x1, y1 = line.y1,
          x2 = line.x2, y2 = line.y2;

    // get a unit vector for the line (from p1 to p2)
    const dx = x2 - x1,
          dy = y2 - y1;

    let length = Math.sqrt(dx*dx + dy*dy);
    if (length == 0) {
        length = 0.001; // stop divides by zero
    }

    const radius = line.thickness / 2;

    // when we make the unit vector, make it a "line unit" where it's
    // half as long as the line's thickness
    const ux = (dx / length) * radius * 1.1,
          uy = (dy / length) * radius * 1.1;

    // rotate it to be normal to the line segment
    const rx = -uy,
          ry = ux;

    // subtract the unit from our first point to get its outer
    // cap point, and add it to the second to get its one as well
    const cx1 = x1 - ux,
          cy1 = y1 - uy,
          cx2 = x2 + ux,
          cy2 = y2 + uy;

    // with these four points, we can add/subtract the rotated unit
    // vector to get the vertex positions.

    const v1i = pushVert(cx1 + rx, cy1 + ry, x1, y1, radius, line.color),
          v2i = pushVert(x1 + rx, y1 + ry, x1, y1, radius, line.color),
          v3i = pushVert(x2 + rx, y2 + ry, x2, y2, radius, line.color),
          v4i = pushVert(cx2 + rx, cy2 + ry, x2, y2, radius, line.color),
          v5i = pushVert(cx2 - rx, cy2 - ry, x2, y2, radius, line.color),
          v6i = pushVert(x2 - rx, y2 - ry, x2, y2, radius, line.color),
          v7i = pushVert(x1 - rx, y1 - ry, x1, y1, radius, line.color),
          v8i = pushVert(cx1 - rx, cy1 - ry, x1, y1, radius, line.color);

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
