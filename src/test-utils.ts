
import {Observable} from "rxjs/Observable";

export function collect<T>(observable: Observable<T>) {
    const calls: T[] = [];
    let subscription = observable.subscribe(val => {
        calls.push(val);
    });

    return {
        assert(...expected: T[]) {
            subscription.unsubscribe();
            return assert.deepEqual(calls, expected);
        }
    };
}
