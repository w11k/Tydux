import {BehaviorSubject, Observable} from "rxjs";
import {Commands} from "../lib/commands";
import {Facade} from "../lib/Facade";
import {createTyduxStore, MountPoint} from "../lib/store";
import {selectToObservable} from "../lib/utils";

export function createTestMount<S>(initialState: S): MountPoint<S, S> {
    const tyduxStore = createTyduxStore(initialState);
    return tyduxStore.createMountPoint(s => s, (s, l) => Object.assign({}, l));
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

export class FacadeMock<S> {
    private _state: S;
    subject: BehaviorSubject<S>;

    constructor(initialState?: S) {
        this._state = initialState;
        this.subject = new BehaviorSubject<S>(initialState);
    }

    /**
     * Sets the state of mock to s and triggers observables created through select
     * @param s the new state
     */
    setState(s: S) {
        this._state = s;
        this.subject.next(s);
    }

    get state(): Readonly<S> {
        return this._state;
    }

    select(): Observable<S>;
    select<R>(selector?: (s: S) => R): Observable<R>;
    select<R>(selector?: (s: S) => R): Observable<R> {
        return selectToObservable(this.subject, selector);
    }
}

export function createTestFacade<C extends Commands<S>, S>(commands: C, initialState: S) {
    return new TestFacade(createTestMount(initialState), "TestFacade", commands);
}
