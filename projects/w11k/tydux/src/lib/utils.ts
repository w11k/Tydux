import {isNil} from "@w11k/rx-ninja";
import {Observable, Operator, Subscriber} from "rxjs";
import {distinctUntilChanged, filter, map, take} from "rxjs/operators";
import {illegalAccessToThis, mutatorHasInstanceMembers, mutatorWrongReturnType} from "./error-messages";
import {Facade} from "./Facade";
import {isPlainObject} from "./lodash/lodash";

let hasProxySupport = false;
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

    return array1.every((val, idx) => {
        return val === array2[idx];
    });
}

export function arePlainObjectsShallowEquals(obj1: any, obj2: any): boolean {
    const keysInObj1 = keysIn(obj1);
    if (keysInObj1.length !== keysIn(obj2).length) {
        return false;
    }

    return keysInObj1.every((val) => {
        return obj1[val] === obj2[val];
    });
}

export function failIfNotUndefined(value: any): void {
    if (value !== undefined) {
        throw new Error(mutatorWrongReturnType);
    }
}

export function failIfInstanceMembersExistExceptState(obj: any) {
    const members = Object.keys(obj).filter(key => key !== "state");
    if (members.length > 0) {
        throw new Error(mutatorHasInstanceMembers + ": " + members.join(", "));
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
    if (target === undefined) {
        return undefined as any;
    }

    const proxy: any = {};
    // re-assign members. Otherwise these members would be marked as read only.
    // Also flattens the new state object.
    Object.assign(proxy, target);

    // TODO remove 'as any' when compiler bug is fixed
    Object.setPrototypeOf(proxy, (target as any));
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

export function last(array: any[]) {
    const length = array == null ? 0 : array.length;
    return length > 0 ? array[length - 1] : undefined;
}

const excludeMethodNames = ["constructor"];

export function functionNamesShallow(object: any): string[] {
    if (object == null) {
        return [];
    }
    return Object.getOwnPropertyNames(object).filter((key) => {
        return typeof Object.getOwnPropertyDescriptor(object, key).value === "function" && excludeMethodNames.indexOf(key) === -1;
    });
}

export function functionNamesDeep(object: any): string[] {
    let fnMembers: string[] = functionNamesShallow(object);
    const proto = Object.getPrototypeOf(object);

    if (proto !== null && proto !== Object.prototype) {
        fnMembers = [...fnMembers, ...functionNamesShallow(proto)];
    }
    return fnMembers;
}

export function keysIn(object: any) {
    if (isNil(object)) {
        return [];
    }

    let keys: string[] = Object.keys(object);
    const proto = Object.getPrototypeOf(object);
    if (proto !== null) {
        keys = [...keys, ...functionNamesDeep(proto)];
    }
    return keys;
}

export function get(obj: any, path: string[]) {
    let target = obj;
    for (const p of path) {
        if (target !== undefined && target.hasOwnProperty(p)) {
            target = target[p];
        } else {
            return undefined;
        }
    }
    return target;
}

export async function untilNoBufferedStateChanges(facade: Facade<any, any>): Promise<any> {
    if (!facade.hasBufferedStateChanges()) {
        return Promise.resolve();
    }

    return new Promise(resolve => {
            facade.select()
                .pipe(
                    filter(() => facade.hasBufferedStateChanges()),
                    take(1)
                )
                .subscribe(() => setTimeout(resolve, 0));
        }
    );
}

export function getDeep(root: any, path: string): any {
    let val = root;
    const levels = path.split(".").reverse();

    while (levels.length > 0) {
        const level = levels.pop();
        val = val[level];
    }

    return val;
}

export function setDeep<R>(root: R, path: string, value: any): any {
    const [head, ...tail] = path.split(".");
    if (tail.length === 0) {
        return {
            ...root,
            [head]: value
        };
    }

    return {
        ...root,
        [head]: setDeep(root[head], tail.join("."), value),
    };
}

export function selectToObservable<S, R = Readonly<S>>(input$: Observable<S>,
                                                       selector?: (state: Readonly<S>) => R) {
    return input$
        .pipe(
            map(stateChange => {
                return !isNil(selector) ? selector(stateChange) : stateChange as any;
            }),
            distinctUntilChanged((oldVal, newVal) => {
                if (Array.isArray(oldVal) && Array.isArray(newVal)) {
                    return areArraysShallowEquals(oldVal, newVal);
                } else if (isPlainObject(newVal) && isPlainObject(newVal)) {
                    return arePlainObjectsShallowEquals(oldVal, newVal);
                } else {
                    return oldVal === newVal;
                }
            }));
}
