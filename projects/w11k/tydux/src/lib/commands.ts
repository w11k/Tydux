import {Action} from "redux";
import {isTyduxDevelopmentModeEnabled} from "./development";
import {createFailingProxy, failIfInstanceMembersExistExceptState, failIfNotUndefined} from "./utils";

export type FunctionPropertyNames<T> = { [K in keyof T]: T[K] extends Function ? K : never }[keyof T];
export type CommandsMethods<T> = Pick<T, FunctionPropertyNames<T>>;
export type CommandReducer<S> = (state: S, action: FacadeAction) => S;

export interface FacadeAction extends Action<string> {
    payload?: any[];
    debugContext?: string;
}

export function createReducerFromCommandsInvoker<S>(facadeId: string, commandsInvoker: CommandsInvoker<Commands<S>>): CommandReducer<S> {
    const typePrefix = `[${facadeId}] `;
    return (state: S, action: FacadeAction) => {
        // check if this action is for this facade
        if (action.type.indexOf(typePrefix) !== 0) {
            return state;
        }
        const commandName = action.type.substr(typePrefix.length);
        return commandsInvoker.invoke(state, commands => {
            let mutatorFn = (commands as any)[commandName];
            if (mutatorFn === undefined) {
                return;
            }

            const result = mutatorFn.apply(commands, action.payload);
            failIfNotUndefined(result);
            failIfInstanceMembersExistExceptState(commands);
        });
    };
}

type StateType<T extends Commands<any>> = T extends Commands<infer S> ? S : any;

export class CommandsInvoker<C extends Commands<any>> {

    constructor(readonly commands: C) {
        failIfInstanceMembersExistExceptState(this.commands);
    }

    invoke(state: StateType<C>,
           withStateOp: (command: C) => void): StateType<C> {

        (this.commands as any).state = state;
        let postState: any;
        const mutatorThisProxy: { state: StateType<C>; } = {state};
        try {
            Object.setPrototypeOf(mutatorThisProxy, this.commands);
            withStateOp(mutatorThisProxy as any);
            postState = (mutatorThisProxy as any).state;
            delete mutatorThisProxy.state;
            failIfInstanceMembersExistExceptState(mutatorThisProxy);
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
