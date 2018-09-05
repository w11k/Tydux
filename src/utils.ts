import {assignIn, every, keysIn} from "lodash";
import {Observable, Operator, Subscriber} from "rxjs";
import {illegalAccessToThis, mutatorWrongReturnType} from "./error-messages";

let hasProxySupport: boolean = false;
try {
    new Proxy({}, {});
    hasProxySupport = true;
} catch (e) {
    // ignore
}

export function areArraysShallowEquals(array1: any[], array2: any[]): boolean {
    if (array1.length !== array2.length) {
        return false;
    }

    return every(array1, (val, idx) => {
        return val === array2[idx];
    });
}

export function arePlainObjectsShallowEquals(obj1: any, obj2: any): boolean {
    let keysInObj1 = keysIn(obj1);
    if (keysInObj1.length !== keysIn(obj2).length) {
        return false;
    }

    return every(keysInObj1, (val) => {
        return obj1[val] === obj2[val];
    });
}

export function failIfNotUndefined(value: any): void {
    if (value !== undefined) {
        throw new Error(mutatorWrongReturnType);
    }
}

// export function assignStateValue<S>(obj: { state: S }, state: S) {
//     delete obj.state;
//     const stateContainer = [state];
//     Object.defineProperty(obj, "state", {
//         configurable: true,
//         enumerable: false,
//         get: () => {
//             return stateContainer[0];
//         },
//         set: (value: any) => {
//             stateContainer[0] = value;
//         }
//     });
// }

export function createProxy<T>(target: T): T {
    const proxy: any = {};
    // re-assign members. Otherwise these members would be marked as read only.
    // Also flattens the new state object.
    assignIn(proxy, target);
    Object.setPrototypeOf(proxy, target);
    return proxy;
}

export function createFailingProxy(): object {
    if (!hasProxySupport) {
        return {};
    }

    const target = {};
    // noinspection JSUnusedGlobalSymbols
    const handler = {
        get: () => {
            throw new Error(illegalAccessToThis);
        },
        set: (): boolean => {
            throw new Error(illegalAccessToThis);
        }
    };

    return new Proxy(target, handler);
}

export function operatorFactory<T>(fn: (subscriber: Subscriber<T>, source: Observable<T>) => () => void): Operator<T, T> {
    return {
        call: (subscriber: Subscriber<T>, source: Observable<T>) => {
            return fn(subscriber, source);
        }
    };
}

export function isNil(obj: any): obj is null | undefined {
    return obj === null || obj === undefined;
}
