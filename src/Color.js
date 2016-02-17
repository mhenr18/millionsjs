const parseCSSColor = require('csscolorparser').parseCSSColor;

export default class Color {
    /**
     * An RGBA color. All components are in the range [0, 255].
     *
     * @property {number} r - Red color component.
     * @property {number} g - Green color component.
     * @property {number} b - Blue color component.
     * @property {number} a - Alpha color component.
     */
    constructor(r, g, b, a) {
        this.r = r;
        this.g = g;
        this.b = b;
        this.a = a;
    }
}

Color.Transparent = new Color(0, 0, 0, 0);

/**
 * Creates an RGBA color from an RGB triplet, where each component is in the
 * range [0, 255]. The returned color has an alpha component value of 255.
 *
 * @param {number} r - Red color component.
 * @param {number} g - Green color component.
 * @param {number} b - Blue color component.
 *
 * @returns {Color}
 */
Color.fromRGB = function (r, g, b) {
    return new Color(r, g, b, 255);
};

/**
 * Creates an RGBA color from an RGBA quartet, where each component ranges from
 * [0, 255].
 *
 * (with r, g, b, a values already provided this function may seem redundant,
 * however in debug mode it will assert that the component values are valid and
 * in range)
 *
 * @param {number} r - Red color component.
 * @param {number} g - Green color component.
 * @param {number} b - Blue color component.
 * @param {number} a - Alpha color component.
 *
 * @returns {Color}
 */
Color.fromRGBA = function (r, g, b, a) {
    return new Color(r, g, b, a);
};

/**
 * Creates an RGBA color from a CSS color string. The given color may be in any
 * of the formats supported by CSS ('#fff', '#0d38fc', 'red',
 * 'rgb(255, 128, 10)', etc).
 *
 * @param {string} cssColor - A CSS color string.
 *
 * @returns {Color}
 */
Color.fromCSS = function (cssColor) {
    const parsed = parseCSSColor(cssColor);
    return new Color(parsed[0], parsed[1], parsed[2], parsed[3] * 255.0);
};
