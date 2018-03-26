import * as _ from "lodash";
import {isTyduxDevelopmentModeEnabled} from "./development";
import {illegalAccessToThis, mutatorHasInstanceMembers, mutatorWrongReturnType} from "./error-messages";
import {MutatorEvent} from "./global-state";
import {createActionFromArguments, StateChange} from "./Store";

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


export abstract class Mutators<S> {

    protected state: S = undefined as any;

    constructor(mutateState: (fn: (state: S) => StateChange<S>) => void) {
        const self = this as any;

        for (let mutatorName of _.functionsIn(self)) {
            const mutatorFn = self[mutatorName];

            console.log("mutatorName", mutatorName);

            // replace with wrapped method
            self[mutatorName] = function () {
                const args = arguments;
                mutateState((oldState) => {

                    // const mutatorThis: any = isRootMutator ? {} : this;

                    // create state mock
                    // if (isRootMutator) {
                    //     const mockState = createProxy(this_.state);
                    //     assignStateValue(mutatorThis, mockState);
                    //     Object.setPrototypeOf(mutatorThis, mutatorMethods);
                    // }

                    // call mutator
                    let duration: number;
                    let result: any;
                    let mockState: any;
                    // mutatorCallStackCount++;
                    try {
                        self.state = oldState;
                        const start = isTyduxDevelopmentModeEnabled() ? Date.now() : 0;
                        result = mutatorFn.apply(this, args);
                        duration = isTyduxDevelopmentModeEnabled() ? Date.now() - start : -1;
                    } finally {
                        // mutatorCallStackCount--;
                        failIfNotUndefined(result);

                        // if (isTyduxDevelopmentModeEnabled()) {
                        //     Object.setPrototypeOf(self, createFailingProxy());
                        // }
                    }

                    // commit new state
                    // if (isRootMutator) {
                    // install failing proxy to catch asynchronous code
                    // mockState = mutatorThis.state;
                    // delete mutatorThis.state;
                    // failIfInstanceMembersExist(mutatorThis);
                    //
                    // if (isTyduxDevelopmentModeEnabled()) {
                    //     Object.setPrototypeOf(mutatorThis, createFailingProxy());
                    // }

                    // merge mock state -> state
                    // const originalState = this_.state;
                    // const newState = isTyduxDevelopmentModeEnabled() ? _.cloneDeep(originalState) : {} as S;
                    // _.assignIn(newState, mockState);

                    // this_.processMutator(
                    //     createActionFromArguments(mutatorName, mutatorFn, args),
                    //     newState,
                    //     duration);
                    // }

                    return {
                        state: self.state,
                        mutatorEvent: new MutatorEvent(
                            mutatorName,
                            createActionFromArguments(mutatorName, mutatorFn, args),
                            duration)

                    };

                });

            };
        }

    }

}
