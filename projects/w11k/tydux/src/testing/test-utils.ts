import {Commands} from "../lib/commands";
import {Facade} from "../lib/Facade";
import {createTyduxStore, MountPoint} from "../lib/store";

export function createTestMount<S>(initialState: S): MountPoint<S, S> {
    const tyduxStore = createTyduxStore(initialState);
    return tyduxStore.internalCreateMountPoint(s => s, (s, l) => Object.assign({}, l));
}

export function createAsyncPromise<T>(returns: T): Promise<T> {
    return new Promise<T>(resolve => {
        setTimeout(() => {
            resolve(returns);
        }, 0);

    });
}

class TestFacade<S, C extends Commands<S>> extends Facade<S, C> {

    private _commands: C;

    get commands(): C {
        return this._commands;
    }

    set commands(commands: C) {
        this._commands = commands;
    }

}

export function createTestFacade<C extends Commands<S>, S>(commands: C, initialState: S) {
    return new TestFacade(createTestMount(initialState), "TestFacade", commands);
}
