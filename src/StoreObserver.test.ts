import {assert} from "chai";
import * as _ from "lodash";
import {Observable} from "rxjs/Observable";
import {takeUntil} from "rxjs/operators";
import {Subject} from "rxjs/Subject";
import {Subscriber} from "rxjs/Subscriber";
import {enableTyduxDevelopmentMode} from "./development";
import {State, StateChangeEvent, StateMutators, Store} from "./Store";
import {collect} from "./test-utils";
import {operatorFactory} from "./utils";


describe("StoreObserver", function () {

    beforeEach(() => enableTyduxDevelopmentMode());

    it("select()", function () {
        const state = {
            count: 0
        };

        class CounterStateGroup extends StateMutators<typeof state> {
            increment() {
                this.state.count++;
            }
        }

        const rootStateGroup = {
            counter: new CounterStateGroup(state)
        };

        const store = new Store(rootStateGroup);

        let collected = collect(store.unbounded().select());
        store.mutate.counter.increment();
        store.mutate.counter.increment();
        collected.assert(
            {counter: {count: 0}},
            {counter: {count: 1}},
            {counter: {count: 2}},
        );
    });

    it("select(selector)", function () {
        const state = {
            count: 0
        };

        class CounterStateGroup extends StateMutators<typeof state> {
            increment() {
                this.state.count++;
            }
        }

        const rootStateGroup = {
            counter: new CounterStateGroup(state)
        };

        const store = new Store(rootStateGroup);

        let collected = collect(store.unbounded()
            .select(s => s.counter.count));
        store.mutate.counter.increment();
        store.mutate.counter.increment();
        collected.assert(0, 1, 2);
    });

    it("selectNonNil(selector)", function () {
        class MyState {
            count?: number;
        }

        class CounterStateGroup extends StateMutators<MyState> {
            increment() {
                this.state.count = !_.isNil(this.state.count) ? this.state.count + 1 : 1;
            }

            clear() {
                this.state.count = undefined;
            }
        }

        const rootStateGroup = {
            counter: new CounterStateGroup(new MyState())
        };

        const store = new Store(rootStateGroup);

        let collected = collect(store.unbounded()
            .selectNonNil(s => s.counter.count));

        store.mutate.counter.increment();
        store.mutate.counter.clear();
        store.mutate.counter.increment();
        store.mutate.counter.increment();
        store.mutate.counter.clear();
        store.mutate.counter.increment();

        collected.assert(1, 1, 2, 1);
    });

    it("select(selector returning array) only emits values when the content of the array changes", function () {
        class MyState {
            a = 0;
            b = 10;
            c = 100;
        }

        class CounterStateGroup extends StateMutators<MyState> {
            incrementAB() {
                this.state.a++;
                this.state.b++;
            }

            incrementC() {
                this.state.c++;
            }
        }

        const rootStateGroup = {
            counter: new CounterStateGroup(new MyState())
        };

        const store = new Store(rootStateGroup);

        let collected = collect(store.unbounded()
            .select(s => [s.counter.a, s.counter.b]));

        store.mutate.counter.incrementAB();
        store.mutate.counter.incrementC();
        store.mutate.counter.incrementAB();
        store.mutate.counter.incrementC();

        collected.assert([0, 10], [1, 11], [2, 12]);
    });

    it("select(selector returning array) only emits values when the content of the array changes", function () {
        class MyState {
            a = 0;
            b = 10;
            c = 100;
        }

        class CounterStateGroup extends StateMutators<MyState> {
            incrementAB() {
                this.state.a++;
                this.state.b++;
            }

            incrementC() {
                this.state.c++;
            }
        }

        const rootStateGroup = {
            counter: new CounterStateGroup(new MyState())
        };

        const store = new Store(rootStateGroup);

        let collected = collect(store.unbounded()
            .select(s => {
                return {
                    a: s.counter.a,
                    b: s.counter.b
                };
            }));

        store.mutate.counter.incrementAB();
        store.mutate.counter.incrementC();
        store.mutate.counter.incrementAB();
        store.mutate.counter.incrementC();

        collected.assert(
            {a: 0, b: 10},
            {a: 1, b: 11},
            {a: 2, b: 12},
        );
    });

    it("select(selector) only triggers when the selected value deeply changed", function () {
        class MyState {
            root = {
                child1: {
                    val1: 1
                },
                child2: {
                    val2: 20
                }
            };
        }

        class CounterStateGroup extends StateMutators<MyState> {
            increment1() {
                this.state.root = {
                    child1: {
                        val1: this.state.root.child1.val1 + 1
                    },
                    child2: {
                        ...this.state.root.child2
                    }
                };
            }
        }

        const rootStateGroup = {
            childs: new CounterStateGroup(new MyState())
        };

        const store = new Store(rootStateGroup);

        let collectChild1 = collect(store.unbounded()
            .select(s => s.childs.root.child1));

        let collectChild2 = collect(store.unbounded()
            .select(s => s.childs.root.child2));

        store.mutate.childs.increment1();

        collectChild1.assert(
            {val1: 1},
            {val1: 2},
        );

        collectChild2.assert(
            {val2: 20}
        );
    });


    it("bounded() can be used to complete the stream", function () {

        const state = {
            count: 0
        };

        class CounterStateGroup extends StateMutators<typeof state> {
            increment() {
                this.state.count++;
            }
        }

        const rootStateGroup = {
            counter: new CounterStateGroup(state)
        };

        const store = new Store(rootStateGroup);

        const stopTrigger = new Subject<true>();
        const operator = operatorFactory(
            (subscriber: Subscriber<StateChangeEvent<State<typeof rootStateGroup>>>,
             source: Observable<StateChangeEvent<State<typeof rootStateGroup>>>) => {
                const sub = source
                    .pipe(
                        takeUntil(stopTrigger)
                    )
                    .subscribe(subscriber);
                return () => {
                    sub.unsubscribe();
                    subscriber.complete();
                };
            });

        let collected = collect(store.bounded(operator).select(s => s.counter.count));

        store.mutate.counter.increment();
        store.mutate.counter.increment();
        stopTrigger.next(true);
        store.mutate.counter.increment();

        collected.assert(
            0,
            1,
            2,
        );

    });

    it("bounded() can be used to wrap the stream", function () {

        const state = {
            count: 0
        };

        class CounterStateGroup extends StateMutators<typeof state> {
            increment() {
                this.state.count++;
            }
        }

        const rootStateGroup = {
            counter: new CounterStateGroup(state)
        };

        const store = new Store(rootStateGroup);

        const events: any[] = [];

        const operator = operatorFactory(
            (subscriber: Subscriber<StateChangeEvent<State<typeof rootStateGroup>>>,
             source: Observable<StateChangeEvent<State<typeof rootStateGroup>>>) => {
                const subscription = source.subscribe(
                    val => {
                        events.push("pre-" + val.state.counter.count);
                        subscriber.next(val);
                        events.push("post-" + val.state.counter.count);
                    },
                    exception => subscriber.error(exception),
                    () => subscriber.complete()
                );

                return () => {
                    subscription.unsubscribe();
                    subscriber.complete();
                };
            });

        store.bounded(operator)
            .select(s => s.counter.count)
            .subscribe(s => events.push(s));

        store.mutate.counter.increment();
        store.mutate.counter.increment();

        assert.deepEqual(events, [
            "pre-0",
            0,
            "post-0",
            "pre-1",
            1,
            "post-1",
            "pre-2",
            2,
            "post-2",
        ]);
    });

});
