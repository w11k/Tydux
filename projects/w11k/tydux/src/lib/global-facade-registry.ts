import {Commands} from "./commands";
import {Facade} from "./Facade";
import {functionNamesDeep} from "./utils";

export type CommandsActionTypeNames<C extends Commands<any>> = {
    [P in keyof C]: C[P] extends () => any ? string : never;
};

const facadeToCommands: { [facadeId: string]: Commands<any> } = {};

export function registerFacadeCommands(facadeId: string, commands: Commands<any>) {
    facadeToCommands[facadeId] = commands;
}

export function deregisterFacadeCommands(facadeId: string) {
    delete facadeToCommands[facadeId];
}

export function createCommandsActionTypeNames<C extends Commands<S>, S>(facade: Facade<S, C>): CommandsActionTypeNames<C> {
    const commands = facadeToCommands[facade.facadeId];

    const actionTypes = {};

    for (const methodName of functionNamesDeep(commands)) {
        (actionTypes as any)[methodName] = facade.createActionName(methodName);
    }

    return actionTypes as any;
}
