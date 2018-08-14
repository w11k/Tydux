import {assert} from "chai";
import {Observable} from "rxjs";
import {filter, take} from "rxjs/operators";
import {ProcessedAction, Store} from "./Store";

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

export async function afterAllStoreEvents(store: Store<any, any>): Promise<any> {
    return store.select()
        .pipe(
            filter(() => !store.hasUndeliveredProcessedActions()),
            take(1)
        )
        .unbounded()
        .toPromise();
}
