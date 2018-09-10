import {assert} from "chai";
import {Observable} from "rxjs";
import {map, takeUntil} from "rxjs/operators";
import {Subject} from "rxjs";
import {Subscriber} from "rxjs";
import {enableTyduxDevelopmentMode} from "./development";
import {resetTydux} from "./global-state";
import {Commands} from "./commands";
import {ObservableSelection} from "./ObservableSelection";
import {Fassade} from "./Fassade";
import {afterAllStoreEvents, collect} from "./test-utils";
import {operatorFactory} from "./utils";


describe("ObservableSelection", function () {

    beforeEach(() => enableTyduxDevelopmentMode());

    afterEach(() => resetTydux());

    it("bounded() can be used to complete the stream", async function () {
        type State = { a: number };

        class TestMutator extends Commands<State> {
            inc() {
                this.state.count++;
            }
        }

        class TestStore extends Fassade<TestMutator, State> {
            action() {
                this.commands.inc();
            }
        }

        const store = new TestStore("", new TestMutator(), {count: 0});

        const stopTrigger = new Subject<true>();
        const operator = operatorFactory(
            (subscriber: Subscriber<any>, source: Observable<any>) => {
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

        let collected = collect(store.select(s => s.count).bounded(operator));

        store.action();
        store.action();

        await afterAllStoreEvents(store);

        stopTrigger.next(true);
        store.action();

        await afterAllStoreEvents(store);

        collected.assert(
            0,
            1,
            2,
        );
    });

    it("bounded() can be used to wrap the stream", async function () {

        type State = { a: number };

        class TestMutator extends Commands<State> {
            inc() {
                this.state.count++;
            }
        }

        class TestStore extends Fassade<TestMutator, State> {
            action() {
                this.commands.inc();
            }
        }

        const store = new TestStore("", new TestMutator(), {count: 0});

        const events: any[] = [];

        const operator = operatorFactory(
            (subscriber: Subscriber<any>, source: Observable<any>) => {
                const subscription = source.subscribe(
                    val => {
                        events.push("pre-" + val);
                        subscriber.next(val);
                        events.push("post-" + val);
                    },
                    exception => subscriber.error(exception),
                    () => subscriber.complete()
                );

                return () => {
                    subscription.unsubscribe();
                    subscriber.complete();
                };
            });

        store
            .select(s => s.count)
            .bounded(operator)
            .subscribe(s => events.push(s));

        store.action();
        store.action();

        await afterAllStoreEvents(store);

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

    it("pipe() can be used to modify the stream", async function () {

        type State = { a: number };

        class TestMutator extends Commands<State> {
            inc() {
                this.state.count++;
            }
        }

        class TestStore extends Fassade<TestMutator, State> {
            action() {
                this.commands.inc();
            }
        }

        const store = new TestStore("", new TestMutator(), {count: 0});

        const events: any[] = [];

        store
            .select(s => s.count)
            .pipe(
                map(x => x + 100),
                map(x => "a:" + x)
            )
            .unbounded()
            .subscribe(s => events.push(s));

        store.action();
        store.action();

        await afterAllStoreEvents(store);

        assert.deepEqual(events, [
            "a:100",
            "a:101",
            "a:102"
        ]);
    });

});
