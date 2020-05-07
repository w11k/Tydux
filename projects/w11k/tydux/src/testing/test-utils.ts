import {Commands, CommandsState} from "../lib/commands";
import {Facade} from "../lib/Facade";
import {createTyduxStore, NamedMountPoint} from "../lib/store";

export function createTestMount<S extends {}>(initialState: S = {} as any): NamedMountPoint<S, { TestMount: S }> {
    const tyduxStore = createTyduxStore({
        TestMount: initialState
    });
    return tyduxStore.createMountPoint("TestMount");
}

export function createAsyncPromise<T>(returns: T): Promise<T> {
    return new Promise<T>(resolve => {
        setTimeout(() => {
            resolve(returns);
        }, 0);

    });
}

class TestFacade<C extends Commands<any>> extends Facade<C> {

    private _commands!: C;

    get commands(): C {
        return this._commands;
    }

    set commands(commands: C) {
        this._commands = commands;
    }

}

export function createTestFacade<C extends Commands<any>>(commands: C, initialState: CommandsState<C>) {
    return new TestFacade(createTestMount(initialState), initialState, commands);
}
