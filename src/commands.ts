import {isTyduxDevelopmentModeEnabled} from "./development";
import {failIfInstanceMembersExistExceptState, FassadeAction} from "./Fassade";
import {createFailingProxy, failIfNotUndefined} from "./utils";

export type FunctionPropertyNames<T> = { [K in keyof T]: T[K] extends Function ? K : never }[keyof T];
export type CommandsMethods<T> = Pick<T, FunctionPropertyNames<T>>;
export type CommandReducer<S> = (state: S, action: FassadeAction) => S;

export function createReducerFromCommands<S>(fassadeId: string, commands: Commands<S>): CommandReducer<S> {
    const typePrefix = `[${fassadeId}] `;
    return (state: S, action: FassadeAction) => {
        // check if this action is for this fassade
        if (action.type.indexOf(typePrefix) !== 0) {
            return state;
        }
        const commandName = action.type.substr(typePrefix.length);
        const mutatorThisProxy: { state: S; } = {state};
        Object.setPrototypeOf(mutatorThisProxy, commands);
        try {
            (commands as any).state = state;
            let mutatorFn = (commands as any)[commandName];
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

export class Commands<S> {

    protected state: S = undefined as any;

}
