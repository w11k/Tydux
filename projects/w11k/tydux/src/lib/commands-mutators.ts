import {Commands, CommandsStateType} from "./commands";

export function createAssignCommand<T extends Commands<any>, F extends keyof CommandsStateType<T>>(
    commands: T, field: F
): (value: CommandsStateType<T>[F]) => void {

    return function (this: any, value: CommandsStateType<T>[F]) {
        (this as any).state = {
            ...(this as any).state,
            [field]: value,
        };
    };
}

export function createMutatorCommand<C extends Commands<any>, F extends keyof CommandsStateType<C>, U extends any[]>(
    commands: C, field: F, withFn: (value: CommandsStateType<C>[F]) => (...args: U) => CommandsStateType<C>[F]
): (...args: U) => void {

    return function (this: any, ...args: U) {
        this.state = {
            ...this.state,
            [field]: withFn(this.state[field])(...args),
        };
    };
}

export function applyMutator<C extends Commands<any>, F extends keyof CommandsStateType<C>, U extends any[]>(
    commands: C, field: F, withFn: (value: CommandsStateType<C>[F]) => (...args: U) => CommandsStateType<C>[F], ...args: U
): void {

    (commands as any).state = {
        ...(commands as any).state,
        [field]: withFn((commands as any).state[field])(...args),
    };
}

export function arrayAppend<E>(source: E[]) {
    return (append: E[]) => {
        return [...source, ...append];
    };
}

export function arrayPrepend<E>(source: E[]) {
    return (prepend: E[]) => {
        return [...prepend, ...source];
    };
}

export function arrayRemoveFirst<E>(source: E[]) {
    return () => {
        const [, ...rest] = source;
        return rest;
    };
}

// export function objectPatch<E extends object>(source: E) {
//     return (patch: Partial<E>) => {
//         return {
//             ...source,
//             ...patch,
//         };
//     };
// }

// type FilterFlags<Base, Condition> = {
//     [Key in keyof Base]:
//     Base[Key] extends Condition ? Key : never
// };
//
// type AllowedNames<Base, Condition> =
//     FilterFlags<Base, Condition>[keyof Base];
//
// export type SubType<Base, Condition> =
//     Pick<Base, AllowedNames<Base, Condition>>;
//
// export type ArrayType<A> = A extends (infer R)[] ? R : never;
//
// class X {
//     aaa = 1;
//     bbb = "abc";
//     ccc = [1, 2, 3];
//     ddd = ["a", "b"];
// }
//
// function createPatchListCommand<C extends Commands<any>,
//     F extends keyof CommandsStateType<C>>(
//     commands: C, field: keyof SubType<CommandsStateType<TestCommands>, Array<any>>
// ) {
// }







