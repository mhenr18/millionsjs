
export var LINECAP_TYPE_NONE = -1;
export var LINECAP_TYPE_ROUNDED = 0;

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
