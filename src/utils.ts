import * as _ from "lodash";
import {Observable} from "rxjs/Observable";
import {Operator} from "rxjs/Operator";
import {Subscriber} from "rxjs/Subscriber";
import {illegalAccessToThis, mutatorWrongReturnType} from "./error-messages";
import {Action} from "./Store";

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

export function failIfNotUndefined(value: any): void {
    if (value !== undefined) {
        throw new Error(mutatorWrongReturnType);
    }
}

export function assignStateValue<S>(obj: { state: S }, state: S) {
    delete obj.state;
    const stateContainer = [state];
    Object.defineProperty(obj, "state", {
        configurable: true,
        enumerable: false,
        get: () => {
            return stateContainer[0];
        },
        set: (value: any) => {
            stateContainer[0] = value;
        }
    });
}

export function createProxy<T>(target: T): T {
    const proxy: any = {};
    // re-assign members. Otherwise these members would be marked as read only.
    // Also flattens the new state object.
    _.assignIn(proxy, target);
    Object.setPrototypeOf(proxy, target);
    return proxy;
}

export function createFailingProxy(): object {
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

export function createActionFromArguments(actionTypeName: string, fn: any, args: IArguments): Action {
    const fnString = fn.toString();
    const argsString = fnString.substring(fnString.indexOf("(") + 1, fnString.indexOf(")"));
    const argNames = argsString.split(",").map((a: string) => a.trim());

    const action: any = {};
    for (let i = 0; i < args.length; i++) {
        const arg = "[" + i + "] " + argNames[i];
        action[arg] = args[i];
    }
    action.type = actionTypeName;

    return action;
}
