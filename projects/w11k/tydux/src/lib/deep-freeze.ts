import {isNil} from "@w11k/rx-ninja";

function weCareAbout(val: any): boolean {
    return val !== null && (Array.isArray(val) || isObjectLike(val));
}

function isObjectLike(val: any): boolean {
    return typeof val === "object";
}

function forKeys(obj: any, iter: any) {
    let idx;
    let keys;
    if (Array.isArray(obj)) {
        idx = obj.length;
        while (idx-- > 0) {
            iter(idx);
        }
        return;
    }
    keys = isNil(obj) ? [] : Object.keys(obj);
    idx = keys.length;
    while (idx-- > 0) {
        iter(keys[idx]);
    }
}

const prevNodes: any[] = [];

export function deepFreeze<T extends any>(coll: T): T {
    if (prevNodes.some(val => val === coll)) {
        throw new Error("object has a reference cycle");
    }
    prevNodes.push(coll);

    forKeys(coll, (key: any) => {
        const prop = coll[key];
        if (weCareAbout(prop)) {
            deepFreeze(prop);
        }
    });
    prevNodes.pop();

    Object.freeze(coll);
    return coll;
}
