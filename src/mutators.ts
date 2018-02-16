import * as _ from "lodash";
import {illegalAccessToThis, mutatorHasInstanceMembers, mutatorWrongReturnType} from "./error-messages";

export function failIfNotUndefined(value: any): void {
    if (value !== undefined) {
        throw new Error(mutatorWrongReturnType);
    }
}

export function failIfInstanceMembersExist(obj: any) {
    let members = _.keys(obj);
    if (members.length > 0) {
        throw new Error(mutatorHasInstanceMembers + ": " + members.join(","));
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


export abstract class Mutators<T> {

    protected state: T = undefined as any;

}
