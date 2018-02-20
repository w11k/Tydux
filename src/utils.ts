import * as _ from "lodash";

export function areArraysShallowEquals(array1: any[], array2: any[]): boolean {
    if (array1.length !== array2.length) {
        return false;
    }

    return _.every(array1, (val, idx) => {
        return val === array2[idx];
    });
}

export function arePlainObjectsShallowEquals(obj1: any, obj2: any): boolean {
    let keysInObj1 = _.keysIn(obj1);
    if (keysInObj1.length !== _.keysIn(obj2).length) {
        return false;
    }

    return _.every(keysInObj1, (val) => {
        return obj1[val] === obj2[val];
    });
}
