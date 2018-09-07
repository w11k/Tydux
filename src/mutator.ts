import {Action} from "redux";
import {isTyduxDevelopmentModeEnabled} from "./development";
import {failIfInstanceMembersExistExceptState} from "./Store";
import {createFailingProxy, failIfNotUndefined} from "./utils";

export interface MutatorAction extends Action<string> {
    readonly type: string;
    readonly payload?: any[];
}

export function createTypeForInvocationFromStore(storeId: string,
                                                 storeMethodName: string | undefined,
                                                 mutatorMethodName: string) {

    if (storeMethodName !== undefined) {
        storeMethodName = "#" + storeMethodName;
    }

    return `${storeId}${storeMethodName} / ${mutatorMethodName}`;
}

export function createActionForMutator(action: MutatorAction): MutatorAction | null {
    const idx = action.type.lastIndexOf(" / ");
    if (idx === -1) {
        return null;
    }

    const tail = action.type.substring(idx + 3);
    if (tail.length === 0) {
        return null;
    }

    return {
        ...action,
        type: tail,
    };
}

export type FunctionPropertyNames<T> = { [K in keyof T]: T[K] extends Function ? K : never }[keyof T];
export type MutatorMethods<T> = Pick<T, FunctionPropertyNames<T>>;

export type MutatorReducer<S> = (state: S, action: Action<string>) => S;

export type MutatorDispatcher = (action: MutatorAction) => void;

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

            const result = mutatorFn.apply(mutatorThisProxy, action.payload);
            const stateAfterRun = mutatorThisProxy.state;
            delete mutatorThisProxy.state;
            failIfNotUndefined(result);
            failIfInstanceMembersExistExceptState(mutatorThisProxy);
            return stateAfterRun;
        } finally {
            if (isTyduxDevelopmentModeEnabled()) {
                Object.setPrototypeOf(mutatorThisProxy, createFailingProxy());
            }
        }
    };
}


export class Mutator<S> {

    state: S = undefined as any;

}
