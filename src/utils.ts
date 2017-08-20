import * as _ from "lodash";

export function isShallowEquals(array1: any[], array2: any[]): boolean {
    if (array1.length !== array2.length) {
        return false;
    }

    return _.every(array1, (val, idx) => {
        return val === array2[idx];
    });
}
