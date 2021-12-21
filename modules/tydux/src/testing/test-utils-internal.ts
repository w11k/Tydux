import {Observable} from "rxjs";

export function collect<T>(observable: Observable<T>) {
    const calls: T[] = [];
    const subscription = observable.subscribe(val => {
        calls.push(JSON.parse(JSON.stringify(val)));
    });

    return {
        getValues() {
            return calls;
        },
        assert(...expected: (T | null | undefined | {})[]) {
            subscription.unsubscribe();
            return expect(calls).toEqual(expected);
        }
    };
}
