import {failIfInstanceMembersExistExceptState} from "./Store";
import {createFailingProxy, failIfNotUndefined} from "./utils";

export interface MutatorAction {
    readonly type: string;

    readonly arguments: any[];
}

export type FunctionPropertyNames<T> = { [K in keyof T]: T[K] extends Function ? K : never }[keyof T];
export type MutatorMethods<T> = Pick<T, FunctionPropertyNames<T>>;

export type MutatorReducer<S> = (state: S, action: MutatorAction) => S;

export function createReducerFromMutator<S>(mutatorInstance: Mutator<S>): MutatorReducer<S> {
    return (state: S, action: MutatorAction) => {
        const mutatorThisProxy: { state: S } = {state};
        Object.setPrototypeOf(mutatorThisProxy, mutatorInstance);
        try {
            mutatorInstance.state = state;
            let mutatorFn = (mutatorInstance as any)[action.type];
            if (mutatorFn === undefined) {
                return state;
            }
            const result = mutatorFn.apply(mutatorThisProxy, action.arguments);
            const stateAfterRun = mutatorThisProxy.state;
            delete mutatorThisProxy.state;
            failIfNotUndefined(result);
            failIfInstanceMembersExistExceptState(mutatorThisProxy);
            return stateAfterRun;
        } finally {
            Object.setPrototypeOf(mutatorThisProxy, createFailingProxy());
        }
    };
}


export abstract class Mutator<S> {

    state: S = undefined as any;

}
