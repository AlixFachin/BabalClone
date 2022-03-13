// utils.js -> Helper functions which can be re-used by all modules

import { Vector3 } from "three";

const _digits = (x, factor=100) => Math.round(x*factor)/factor;

const vector2String = v => {
    return `(${_digits(v.x,1000)},${_digits(v.y,1000)},${_digits(v.z,1000)})`;
}


const absFloor = (x, scale = 0.001) => {
    if (x >= 0) {
        return Math.floor(x / scale) * scale;
    } else {
        return -1 * Math.floor(-x / scale) * scale;
    }
}

const vectorAbsFloor = (v, scale = 0.001) => {
    if (!(v instanceof Vector3)) {
        return;
    }

    v.x = absFloor(v.x, scale);
    v.y = absFloor(v.y, scale);
    v.z = absFloor(v.z, scale);
}

export {
    vector2String,
    vectorAbsFloor,
    absFloor
}