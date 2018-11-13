import {Action} from "redux";
import {isTyduxDevelopmentModeEnabled} from "./development";
import {createFailingProxy, failIfInstanceMembersExistExceptState, failIfNotUndefined} from "./utils";

export type FunctionPropertyNames<T> = { [K in keyof T]: T[K] extends Function ? K : never }[keyof T];
export type CommandsMethods<T> = Pick<T, FunctionPropertyNames<T>>;
export type CommandReducer<S> = (state: S, action: FacadeAction) => S;

export interface FacadeAction extends Action<string> {
    payload: any[];
    debugContext?: string;
}

export function createReducerFromCommands<S>(facadeId: string, commandsInvoker: CommandsInvoker<Commands<S>>): CommandReducer<S> {
    const typePrefix = `[${facadeId}] `;
    return (state: S, action: FacadeAction) => {
        // check if this action is for this facade
        if (action.type.indexOf(typePrefix) !== 0) {
            return state;
        }
        const commandName = action.type.substr(typePrefix.length);
        // const mutatorThisProxy: { state: S; } = {state};
        // Object.setPrototypeOf(mutatorThisProxy, commands);
        try {
            // (commands as any).state = state;
            const stateAfterRun = commandsInvoker.invoke(state, commands => {
                let mutatorFn = (commands as any)[commandName];
                if (mutatorFn === undefined) {
                    return;
                }

                const result = mutatorFn.apply(commands, action.payload);
                failIfNotUndefined(result);
                failIfInstanceMembersExistExceptState(commands);
            });

            // const stateAfterRun = mutatorThisProxy.state;
            // delete mutatorThisProxy.state;
            // failIfInstanceMembersExistExceptState(mutatorThisProxy);
            return stateAfterRun;
        } finally {
            if (isTyduxDevelopmentModeEnabled()) {
                // Object.setPrototypeOf(mutatorThisProxy, createFailingProxy());
            }
        }
    };
}

type StateType<T extends Commands<any>> = T extends Commands<infer S> ? S : any;

export interface CommandsConstructor<C extends Commands<any>> {
    new(setState: (state: any) => void, getState: () => any): C
}

export class CommandsInvoker<C extends Commands<any>> {

    private state: StateType<C> | undefined;

    readonly commands: C;

    constructor(commandsType: CommandsConstructor<C>) {
        this.commands = new commandsType(
            state => {
                if (this.state === undefined) {
                    throw new Error("Commands' methods must be invoked via a CommandsInvoker!")
                }
                return this.state = state;
            },
            () => {
                if (this.state === undefined) {
                    throw new Error("Commands' methods must be invoked via a CommandsInvoker!")
                }
                return this.state;
            }
        );

        console.log("this.commands", this.commands);
    }

    invoke(state: StateType<C>,
           withStateOp: (command: C) => void): StateType<C> {

        this.state = state;
        let postState: any;
        try {



            withStateOp(this.commands);
            postState = this.state;
        } finally {
            this.state = undefined;
        }

        return postState;
    }

}

export class Commands<S> {

    constructor(private setState: (state: S) => void,
                private getState: () => S) {
    }

    protected get state(): S {
        console.log("this.setState", this.setState);
        console.log("this.getState", this.getState);
        return this.getState();
    }

    protected set state(newState: S) {
        this.setState(newState);
    }

}
