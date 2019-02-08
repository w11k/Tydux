import {Observable, Operator, Subscriber} from "rxjs";
import {distinctUntilChanged, filter, map, take} from "rxjs/operators";
import {illegalAccessToThis, mutatorHasInstanceMembers, mutatorWrongReturnType} from "./error-messages";
import {Facade} from "./Facade";
import {isPlainObject} from "./lodash/lodash";

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

    return array1.every((val, idx) => {
        return val === array2[idx];
    });
}

export function arePlainObjectsShallowEquals(obj1: any, obj2: any): boolean {
    let keysInObj1 = keysIn(obj1);
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
    // assignIn(proxy, target);
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

export function isNil(obj: any): obj is null | undefined {
    return obj === null || obj === undefined;
}


export function last(array: any[]) {
    const length = array == null ? 0 : array.length;
    return length > 0 ? array[length - 1] : undefined;
}

export function functions(object: any): string[] {
    if (object == null) {
        return [];
    }
    return Object.keys(object).filter((key) => {
        return object.hasOwnProperty(key) && typeof object[key] === "function";
    });
}

export function functionsIn(object: any) {
    let fnMembers: string[] = functions(object);
    let proto = Object.getPrototypeOf(object);
    if (proto !== null) {
        fnMembers = [...fnMembers, ...functionsIn(proto)];
    }
    return fnMembers;
}

export function keysIn(object: any) {
    if (isNil(object)) {
        return [];
    }

    let keys: string[] = Object.keys(object);
    let proto = Object.getPrototypeOf(object);
    if (proto !== null) {
        keys = [...keys, ...functionsIn(proto)];
    }
    return keys;
}

export function get(obj: any, path: string[]) {
    let target = obj;
    for (let p of path) {
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


export function selectToObservable<S, R>(input$: Observable<S>,
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


export function selectNonNilToObervable<S, R>(input$: Observable<S>,
                                              selector?: (state: Readonly<S>) => R | null | undefined) {
    return selectToObservable(input$, selector)
        .pipe(
            filter(val => !isNil(val)),
            map(val => val!)
        );
}
