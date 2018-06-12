import {createFailingProxy, createProxy, failIfNotUndefined} from "./utils";

export interface MutatorAction {
    type: string;

    payload?: any[];
}


export function createReducerFromMutator<S>(mutatorInstance: Mutator<S>): (state: S, action: MutatorAction) => S {
    return (state: S, action: MutatorAction) => {
        const mutatorThisProxy = {};
        Object.setPrototypeOf(mutatorThisProxy, mutatorInstance);
        try {
            mutatorInstance.state = state;
            let mutatorFn = (mutatorInstance as any)[action.type];
            if (mutatorFn === undefined) {
                return state;
            }
            const result = mutatorFn.apply(mutatorThisProxy, action.payload);
            failIfNotUndefined(result);
            return mutatorInstance.state;
        } finally {
            Object.setPrototypeOf(mutatorThisProxy, createFailingProxy());
        }
    };
}


export abstract class Mutator<S> {

    state: S = undefined as any;

}
