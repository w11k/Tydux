import {assert} from "chai";
import {Observable} from "rxjs/Observable";
import {filter, take} from "rxjs/operators";
import {MutatorEvent, Store} from "./Store";

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

export async function afterAllStoreEvents(store: Store<any, any>): Promise<MutatorEvent<any>> {
    return store.mutatorEvents$
        .pipe(
            filter(() => !store.hasUndispatchedMutatorEvents()),
            take(1)
        )
        .toPromise();
}
