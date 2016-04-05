
export var LINECAP_TYPE_NONE = -1;
export var LINECAP_TYPE_ROUNDED = 0;
export var LINECAP_TYPE_ARROW = 1;
export var LINECAP_TYPE_HALF_ARROW_A = 2;
export var LINECAP_TYPE_HALF_ARROW_B = 3;

export function none() {
    return {
        type: LINECAP_TYPE_NONE
    };
}

export function rounded() {
    return {
        type: LINECAP_TYPE_ROUNDED
    };
}

export function arrow(lengthScale = 1) {
    return {
        type: LINECAP_TYPE_ARROW,
        lengthScale: lengthScale
    };
}

export function halfArrowA(lengthScale = 1, widthScale = 1) {
    return {
        type: LINECAP_TYPE_HALF_ARROW_A,
        lengthScale: lengthScale,
        widthScale: widthScale
    };
}

export function halfArrowB(lengthScale = 1, widthScale = 1) {
    return {
        type: LINECAP_TYPE_HALF_ARROW_B,
        lengthScale: lengthScale,
        widthScale: widthScale
    };
}
