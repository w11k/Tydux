import produce from "immer";
import {Action} from "redux";
import {isTyduxDevelopmentModeEnabled} from "./development";
import {createFailingProxy, failIfInstanceMembersExistExceptStateOrMethods, failIfNotUndefined} from "./utils";

export type FunctionPropertyNames<T> = { [K in keyof T]: T[K] extends (...args: any[]) => any ? K : never }[keyof T];
export type CommandsMethods<T> = Pick<T, FunctionPropertyNames<T>>;
export type CommandReducer<S> = (state: S, action: FacadeAction) => S;

export interface FacadeAction extends Action<string> {
    payload?: any[];
    facadeMethod?: string;
}

export function createReducerFromCommandsInvoker<S>(facadeId: string, commandsInvoker: CommandsInvoker<Commands<S>>): CommandReducer<S> {
    const typePrefix = `[${facadeId}] `;
    return (state: S, action: FacadeAction) => {
        // check if this action is for this facade
        if (action.type.indexOf(typePrefix) !== 0) {
            return state;
        }
        const commandName = action.type.substr(typePrefix.length);
        return produce(state, (draft) => (commandsInvoker.invoke(draft as any, commands => {
            const mutatorFn = (commands as any)[commandName];
            if (mutatorFn === undefined) {
                return;
            }

            const result = mutatorFn.apply(commands, action.payload);
            failIfNotUndefined(result);
            failIfInstanceMembersExistExceptStateOrMethods(commands);
        }) as any));
    };
}

export type CommandsState<T extends Commands<any>> = T extends Commands<infer S> ? S : never;

export class CommandsInvoker<C extends Commands<any>> {

    constructor(readonly commands: C) {
        failIfInstanceMembersExistExceptStateOrMethods(this.commands);
    }

    invoke(state: CommandsState<C>,
           withStateOp: (commands: C) => void): CommandsState<C> {

        (this.commands as any).state = state;
        let postState: any;
        const mutatorThisProxy: { state?: CommandsState<C>; } = {state};
        try {
            Object.setPrototypeOf(mutatorThisProxy, this.commands);
            withStateOp(mutatorThisProxy as any);
            postState = (mutatorThisProxy as any).state;
            delete mutatorThisProxy.state;
            failIfInstanceMembersExistExceptStateOrMethods(mutatorThisProxy);
        } finally {
            if (isTyduxDevelopmentModeEnabled()) {
                Object.setPrototypeOf(mutatorThisProxy, createFailingProxy());
            }
        }

        return postState;
    }

}

export class Commands<S> {
    protected state: S = undefined as any;
}
