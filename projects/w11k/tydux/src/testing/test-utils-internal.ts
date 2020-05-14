import {assert} from "chai";
import {Observable} from "rxjs";

export function collect<T>(observable: Observable<T>) {
    const calls: T[] = [];
    const subscription = observable.subscribe(val => {
        calls.push(val);
    });

    return {
        getValues() {
            return calls;
        },
        assert(...expected: (T | null | undefined | {})[]) {
            subscription.unsubscribe();
            return assert.deepEqual(calls, expected);
        }
    };
}
