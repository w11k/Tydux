import {assert} from "chai";
import {Observable, Subject, Subscriber} from "rxjs";
import {map, takeUntil} from "rxjs/operators";
import {Commands} from "./commands";
import {enableTyduxDevelopmentMode} from "./development";
import {Fassade} from "./Fassade";
import {ObservableSelection} from "./ObservableSelection";
import {createTyduxStore} from "./store";
import {collect} from "./test-utils";
import {operatorFactory, untilNoBufferedStateChanges} from "./utils";


describe("ObservableSelection", function () {

    beforeEach(() => enableTyduxDevelopmentMode());

    it("bounded() can be used to complete the stream", async function () {
        type State = { count: number };

        class TestCommands extends Commands<State> {
            inc() {
                this.state.count++;
            }
        }

        class TestFassade extends Fassade<State, TestCommands> {
            action() {
                this.commands.inc();
            }
        }

        const tyduxStore = createTyduxStore({count: 0});
        const mount = tyduxStore.createMountPoint(s => s, (state, fassade) => ({...fassade}));
        const fassade = new TestFassade(mount, "TestFassade", new TestCommands());

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

        let collected = collect(fassade.select(s => s.count).bounded(operator));

        fassade.action();
        fassade.action();

        await untilNoBufferedStateChanges(fassade);

        stopTrigger.next(true);
        fassade.action();

        await untilNoBufferedStateChanges(fassade);

        collected.assert(
            0,
            1,
            2,
        );
    });

    it("bounded() can be used to wrap the stream", async function () {
        type State = { count: number };

        class TestCommands extends Commands<State> {
            inc() {
                this.state.count++;
            }
        }

        class TestFassade extends Fassade<State, TestCommands> {
            action() {
                this.commands.inc();
            }
        }

        const tyduxStore = createTyduxStore({count: 0});
        const mount = tyduxStore.createMountPoint(s => s, (state, fassade) => ({...fassade}));
        const fassade = new TestFassade(mount, "TestFassade", new TestCommands());

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

        fassade
            .select(s => s.count)
            .bounded(operator)
            .subscribe(s => events.push(s));

        fassade.action();
        fassade.action();

        await untilNoBufferedStateChanges(fassade);

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

        type State = { count: number };

        class TestCommands extends Commands<State> {
            inc() {
                this.state.count++;
            }
        }

        class TestFassade extends Fassade<State, TestCommands> {
            action() {
                this.commands.inc();
            }
        }

        const tyduxStore = createTyduxStore({count: 0});
        const mount = tyduxStore.createMountPoint(s => s, (state, fassade) => ({...fassade}));
        const fassade = new TestFassade(mount, "TestFassade", new TestCommands());

        const events: any[] = [];

        fassade
            .select(s => s.count)
            .pipe(
                map(x => x + 100),
                map(x => "a:" + x)
            )
            .unbounded()
            .subscribe(s => events.push(s));

        fassade.action();
        fassade.action();

        await untilNoBufferedStateChanges(fassade);

        assert.deepEqual(events, [
            "a:100",
            "a:101",
            "a:102"
        ]);
    });

});
