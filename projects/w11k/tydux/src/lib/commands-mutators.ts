import {Commands, CommandsStateType} from "./commands";

export function createAssignFieldCommand<T extends Commands<any>, F extends keyof CommandsStateType<T>>(
    commands: T, field: F
): (value: CommandsStateType<T>[F]) => void {

    return function (this: any, value: CommandsStateType<T>[F]) {
        (this as any).state = {
            ...(this as any).state,
            [field]: value,
        };
    };

}
