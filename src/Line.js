
export default class Line {
    constructor(p1, p2) {
        this.setOptions(p1, p2);
    }

    setOptions(p1, p2) {
        this.p1 = p1;
        this.p2 = p2;
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
