import {assert} from "chai";
import {Observable} from "rxjs";
import {createTyduxStore, MountPoint} from "./store";

export function createTestMount<S>(initialState: S): MountPoint<S, S> {
    const tyduxStore = createTyduxStore(initialState);
    return tyduxStore.createMountPoint(s => s, (s, l) => Object.assign({}, l));
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

