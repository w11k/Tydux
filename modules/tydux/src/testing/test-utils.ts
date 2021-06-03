import {BehaviorSubject, Observable} from "rxjs";
import {Commands, CommandsState} from "../lib/commands";
import {Facade} from "../lib/Facade";
import {createTyduxStore, NamedMountPoint} from "../lib/store";
import {selectToObservable} from "../lib/utils";

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

    public commands!: C;

}

export function createTestFacade<C extends Commands<any>>(commands: C, initialState: CommandsState<C>) {
    return new TestFacade(createTestMount(initialState), commands, initialState);
}

export class FacadeMock<S> {
    subject: BehaviorSubject<S>;

    private _state: S;

    get state(): Readonly<S> {
        return this._state;
    }

    constructor(initialState: S) {
        this._state = initialState;
        this.subject = new BehaviorSubject<S>(this._state);
    }

    /**
     * Sets the state of mock to s and triggers observables created through select
     * @param s the new state
     */
    setState(s: S) {
        this._state = s;
        this.subject.next(s);
    }

    select(): Observable<S>;
    select<R>(selector?: (s: S) => R): Observable<R>;
    select<R>(selector?: (s: S) => R): Observable<R> {
        return selectToObservable(this.subject, selector);
    }
}
