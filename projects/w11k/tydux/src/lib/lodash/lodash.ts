/* tslint:disable */

export function forEach<T>(obj: T, fn: (val: any, key: keyof T) => void) {
    for (let key in obj) {
        if (obj.hasOwnProperty(key)) {
            fn(obj[key], key);
        }
    }
}

export function forEachIn(obj: any, fn: (val: any, key: any) => void) {
    forEach(obj, fn);

    let proto = Object.getPrototypeOf(obj);
    if (proto !== null) {
        forEachIn(proto, fn);
    }
}

export function has(obj: any, key: any) {
    return obj[key] !== undefined;
}

export function isObjectLike(value: any) {
    return typeof value === "object" && value !== null;
}

export function isPlainObject(value: any) {
    if (!isObjectLike(value) || baseGetTag(value) !== "[object Object]") {
        return false;
    }
    if (Object.getPrototypeOf(value) === null) {
        return true;
    }
    let proto = value;
    while (Object.getPrototypeOf(proto) !== null) {
        proto = Object.getPrototypeOf(proto);
    }
    return Object.getPrototypeOf(value) === proto;
}

const symToStringTag = typeof Symbol !== "undefined" ? Symbol.for("toStringTag") : undefined;

function baseGetTag(value: any) {
    if (value == null) {
        return value === undefined ? "[object Undefined]" : "[object Null]";
    }
    if (!(symToStringTag && symToStringTag in Object(value))) {
        return Object.prototype.toString.call(value);
    }
    const isOwn = value.hasOwnProperty(symToStringTag);
    const tag = value[symToStringTag];
    let unmasked = false;
    try {
        value[symToStringTag] = undefined;
        unmasked = true;
    } catch (e) {
    }

    const result = Object.prototype.toString.call(value);
    if (unmasked) {
        if (isOwn) {
            value[symToStringTag] = tag;
        } else {
            delete value[symToStringTag];
        }
    }
    return result;
}

export function eq(value: any, other: any) {
    return value === other || (value !== value && other !== other);
}
