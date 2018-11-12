import {assert} from "chai";
import {Observable, Subject, Subscriber} from "rxjs";
import {map, takeUntil} from "rxjs/operators";
import {Commands} from "./commands";
import {enableTyduxDevelopmentMode} from "./development";
import {Facade} from "./Facade";
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

        class TestFacade extends Facade<State, TestCommands> {
            action() {
                this.commands.inc();
            }
        }

        const tyduxStore = createTyduxStore({count: 0});
        const mount = tyduxStore.createMountPoint(s => s, (state, facade) => ({...facade}));
        const facade = new TestFacade(mount, "TestFacade", new TestCommands());

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

        let collected = collect(facade.select(s => s.count).bounded(operator));

        facade.action();
        facade.action();

        await untilNoBufferedStateChanges(facade);

        stopTrigger.next(true);
        facade.action();

        await untilNoBufferedStateChanges(facade);

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

        class TestFacade extends Facade<State, TestCommands> {
            action() {
                this.commands.inc();
            }
        }

        const tyduxStore = createTyduxStore({count: 0});
        const mount = tyduxStore.createMountPoint(s => s, (state, facade) => ({...facade}));
        const facade = new TestFacade(mount, "TestFacade", new TestCommands());

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

        facade
            .select(s => s.count)
            .bounded(operator)
            .subscribe(s => events.push(s));

        facade.action();
        facade.action();

        await untilNoBufferedStateChanges(facade);

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

        class TestFacade extends Facade<State, TestCommands> {
            action() {
                this.commands.inc();
            }
        }

        const tyduxStore = createTyduxStore({count: 0});
        const mount = tyduxStore.createMountPoint(s => s, (state, facade) => ({...facade}));
        const facade = new TestFacade(mount, "TestFacade", new TestCommands());

        const events: any[] = [];

        facade
            .select(s => s.count)
            .pipe(
                map(x => x + 100),
                map(x => "a:" + x)
            )
            .unbounded()
            .subscribe(s => events.push(s));

        facade.action();
        facade.action();

        await untilNoBufferedStateChanges(facade);

        assert.deepEqual(events, [
            "a:100",
            "a:101",
            "a:102"
        ]);
    });

});
