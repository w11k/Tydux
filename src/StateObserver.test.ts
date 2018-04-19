import {assert} from "chai";
import {Observable} from "rxjs/Observable";
import {takeUntil} from "rxjs/operators";
import {Subject} from "rxjs/Subject";
import {Subscriber} from "rxjs/Subscriber";
import {enableTyduxDevelopmentMode} from "./development";
import {resetTydux} from "./global-state";
import {Mutators} from "./mutators";
import {Store} from "./Store";
import {collect} from "./test-utils";
import {operatorFactory} from "./utils";


describe("StoreObserver", function () {

    beforeEach(() => enableTyduxDevelopmentMode());

    afterEach(() => resetTydux());

    it("bounded() can be used to complete the stream", function () {

        type State = { a: number };

        class TestMutator extends Mutators<State> {
            inc() {
                this.state.a++;
            }
        }

        class TestStore extends Store<TestMutator, State> {
            action() {
                this.mutate.inc();
            }
        }

        const store = new TestStore("", new TestMutator(), {a: 0});

        const stopTrigger = new Subject<true>();
        const operator = operatorFactory(
            (subscriber: Subscriber<State>, source: Observable<State>) => {
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

        let collected = collect(store.bounded(operator).select(s => s.a));

        store.action();
        store.action();
        stopTrigger.next(true);
        store.action();

        collected.assert(
            0,
            1,
            2,
        );

    });

    it("bounded() can be used to wrap the stream", function () {

        type State = { a: number };

        class TestMutator extends Mutators<State> {
            inc() {
                this.state.a++;
            }
        }

        class TestStore extends Store<TestMutator, State> {
            action() {
                this.mutate.inc();
            }
        }

        const store = new TestStore("", new TestMutator(), {a: 0});

        const events: any[] = [];

        const operator = operatorFactory(
            (subscriber: Subscriber<State>, source: Observable<State>) => {
                const subscription = source.subscribe(
                    val => {
                        events.push("pre-" + val.a);
                        subscriber.next(val);
                        events.push("post-" + val.a);
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
            .select(s => s.a)
            .subscribe(s => events.push(s));

        store.action();
        store.action();

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
