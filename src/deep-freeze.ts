function weCareAbout(val: any): boolean {
    return val !== null && (Array.isArray(val) || isObjectLike(val));
}

function isObjectLike(val: any): boolean {
    return typeof val === "object" &&
            val.constructor === Object &&
            Object.getPrototypeOf(val) === Object.prototype;
}


function forKeys(obj: any, iter: any) {
    let idx, keys
    if (Array.isArray(obj)) {
        idx = obj.length;
        while (idx--) {
            iter(idx);
        }
        return;
    }
    keys = Object.keys(obj);
    idx = keys.length;
    while (idx--) {
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
