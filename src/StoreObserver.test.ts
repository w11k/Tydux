import {assert} from "chai";
import {Observable} from "rxjs/Observable";
import {takeUntil} from "rxjs/operators";
import {ReplaySubject} from "rxjs/ReplaySubject";
import {Subject} from "rxjs/Subject";
import {enableTyduxDevelopmentMode} from "./development";
import {resetTydux} from "./global-state";
import {Mutators} from "./mutators";
import {MutatorEvent, Store} from "./Store";
import {collect} from "./test-utils";


describe("StoreObserver", function () {

    beforeEach(() => enableTyduxDevelopmentMode());

    afterEach(() => resetTydux());

    it("bounded() can be used to complete the stream", function () {

        class TestMutator extends Mutators<{ a: number; }> {
            inc() {
                this.state.a++;
            }
        }

        class TestStore extends Store<TestMutator, { a: number; }> {
            action() {
                this.mutate.inc();
            }
        }

        const store = new TestStore("", new TestMutator(), {a: 0});

        const stopTrigger = new Subject<true>();
        const operator = (stream: Observable<MutatorEvent<any>>) => {
            return stream.pipe(
                takeUntil(stopTrigger)
            );
        };

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

        class TestMutator extends Mutators<{ a: number }> {
            inc() {
                this.state.a++;
            }
        }

        class TestStore extends Store<TestMutator, { a: number }> {
            action() {
                this.mutate.inc();
            }
        }

        const store = new TestStore("", new TestMutator(), {a: 0});

        const events: any[] = [];

        const operator = (stream: Observable<MutatorEvent<{ a: number }>>) => {
            const hub = new ReplaySubject<MutatorEvent<any>>(1);
            const sub = stream.subscribe(
                val => {
                    events.push("pre-" + val.state.a);
                    hub.next(val);
                    events.push("post-" + val.state.a);
                },
                err => hub.error(err),
                () => hub.complete()
            );

            return hub.asObservable();
        };

        store.bounded(operator)
            .select(s => s.a)
            .subscribe(s => events.push(s));

        store.action();
        store.action();

        console.log("events", events);
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
