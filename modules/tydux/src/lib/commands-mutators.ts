import {Commands, CommandsState} from "./commands";

export function createAssignCommand<T extends Commands<any>, F extends keyof CommandsState<T>>(
    commands: T,
    field: F
): (value: CommandsState<T>[F]) => void {

    return function (this: any, value: CommandsState<T>[F]) {
        (this as any).state = {
            ...(this as any).state,
            [field]: value,
        };
    };
}

export function createMutator<C extends Commands<any>, F extends keyof CommandsState<C>, U extends any[]>(
    commands: C,
    field: F,
    withFn: (value: CommandsState<C>[F]) => (...args: U) => CommandsState<C>[F]
): (...args: U) => void {

    return function (this: any, ...args: U) {
        this.state = {
            ...this.state,
            [field]: withFn(this.state[field])(...args),
        };
    };
}

// export function applyMutator<C extends Commands<any>,
//     F extends keyof CommandsState<C>,
//     V extends CommandsState<C>[F],
//     U extends any[]>(
//     commands: C,
//     field: F,
//     withFn: (value: V) => (...args: U) => V,
//     ...args: U
// ): void {
//
//     (commands as any).state = {
//         ...(commands as any).state,
//         [field]: withFn((commands as any).state[field])(...args),
//     };
// }

///////////////////////////////////////////////////////////////////////////
// operators
///////////////////////////////////////////////////////////////////////////

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

export function arrayInsertAtIndex<E>(source: E[], index: number) {
    return (newItems: E[]) => {
        return [
            ...source.slice(0, index),
            ...newItems,
            ...source.slice(index)
        ];
    };
}

export function arrayRemoveFirst<E>(source: E[]) {
    return () => {
        const [, ...rest] = source;
        return rest;
    };
}

export function objectPatch<E>(source: E): (patch: Partial<E>) => E {
    return (patch: Partial<E>) => {
        return {
            ...source,
            ...patch,
        };
    };
}

export function swapPositions<E>(source: E[], a: number, b: number) {
    const sourceCopy = [...source];
    [sourceCopy[a], sourceCopy[b]] = [sourceCopy[b], sourceCopy[a]];
    return sourceCopy;
}

//
// type FilterFlags<Base, Condition> = {
//     [Key in keyof Base]:
//     Base[Key] extends Condition ? Key : never
// };
//
// type AllowedNames<Base, Condition> =
//     FilterFlags<Base, Condition>[keyof Base];
//
// export type FieldsOfType<Base, Condition> =
//     Pick<Base, AllowedNames<Base, Condition>>;
//
//
// class Person {
//     id!: string;
//     id2!: number;
//     aaa!: boolean;
//     bbb!: string[];
// }
//
// declare const foo: FieldsOfType<Person, string | number>;

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







