
export default class Line {
    constructor(options) {
        this.setOptions(options);
    }

    setOptions(options) {
        this.x1 = options.p1.x;
        this.y1 = options.p1.y;
        this.x2 = options.p2.x;
        this.y2 = options.p2.y;
        this.color = options.color;
        this.thickness = options.thickness;
        this.cap1 = options.p1.capStyle;
        this.cap2 = options.p2.capStyle;
    }
}

/**
 * @alias LineCapStyle
 * @readonly
 * @enum {string}
 */
Line.CapStyles = {
    /** No special cap, results in a flat endpoint. */
    NONE: 'none',

    /** A rounded semi-circle. Extends beyond the line. */
    ROUNDED: 'rounded',

    // if you were drawing a line from bottom to top and putting a cap on the
    // top end, it's "left" and "right" with respect to that

    /** A half arrow, where the  */
    HALF_ARROW_LEFT: 'half-arrow-left',
    HALF_ARROW_RIGHT: 'half-arrow-right',

    /** A full arrow. */
    ARROW: 'arrow'
}
