import {assert} from "chai";
import {createStore, Store} from "redux";
import {Observable} from "rxjs";
import {take} from "rxjs/operators";
import {createMountPoint, Fassade, FassadeAction, MountPoint, tyduxReducer} from "./Fassade";

export const NOOP = () => {
};

export function createReduxWithMountPoint<S>(initialState: S): [Store<S, FassadeAction>, MountPoint<S, S>] {
    function app(state = initialState, action: FassadeAction) {
        return tyduxReducer(state, action);
    }

    let reduxStore = createStore(app);
    const mount = createMountPoint(reduxStore, s => s, (s, l) => ({...l}));
    return [reduxStore, mount];
}

export function collect<T>(observable: Observable<T>) {
    const calls: T[] = [];
    let subscription = observable.subscribe(val => {
        calls.push(val);
    });

    return {
        getValues() {
            return calls;
        },
        assert(...expected: (T | null | undefined)[]) {
            subscription.unsubscribe();
            return assert.deepEqual(calls, expected);
        }
    };
}

export function createAsyncPromise<T>(returns: T): Promise<T> {
    return new Promise<T>(resolve => {
        setTimeout(() => {
            resolve(returns);
        }, 0);

    });
}

export async function afterAllStoreEvents(store: Fassade<any, any>): Promise<any> {
    return store.select()
        .pipe(
            // filter(() => !store.hasUndeliveredProcessedActions()),
            take(1)
        )
        .unbounded()
        .toPromise();
}
