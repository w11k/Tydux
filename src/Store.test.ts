import {Observable} from "rxjs/Observable";
import {enableDevelopmentMode, Store} from "./Store";

function collect<T>(observable: Observable<T>) {
    const calls: T[] = [];
    let subscription = observable.subscribe(val => {
        calls.push(val);
    });

    return {
        assertEquals(...expected: T[]) {
            subscription.unsubscribe();
            return assert.deepEqual(calls, expected);
        }
    };
}

describe("Store", function () {

    beforeEach(function () {
        enableDevelopmentMode();
    });

    it("bla", function () {
        class S extends Store<{ n1: number }> {
            action1() {
                this.action("action1", s => {
                    s.n1++;
                });
            }
        }

        const store = new S({n1: 0});
        const calls = collect(store.select());
        store.action1();
        calls.assertEquals({n1: 0}, {n1: 1});
    });

});
