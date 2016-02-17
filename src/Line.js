
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

Line.CapStyles = {
    NONE: 'none',
    ROUNDED: 'rounded',

    // if you were drawing a line from bottom to top and putting a cap on the
    // top end, it's "left" and "right" with respect to that
    HALF_ARROW_LEFT: 'half-arrow-left',
    HALF_ARROW_RIGHT: 'half-arrow-right',

    ARROW: 'arrow'
}
