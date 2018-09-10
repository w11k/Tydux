import {assert} from "chai";
import {Action, createStore, Store as ReduxStore} from "redux";
import {Commands} from "./commands";
import {enableTyduxDevelopmentMode} from "./development";
import {createMountPoint, Fassade, tyduxReducer} from "./Fassade";
import {resetTydux} from "./global-state";
import {collect, createReduxWithMountPoint} from "./test-utils";


describe("Fassade", function () {

    beforeEach(() => enableTyduxDevelopmentMode());

    afterEach(() => resetTydux());

    it("documentation", async function () {
        const initialState = {
            someValue: 0,
            managedByFassade: {
                val: 10
            }
        };

        type AppState = typeof initialState;
        type ManagedByFassadeState = typeof initialState.managedByFassade;

        function app(state = initialState, action: Action) {
            return tyduxReducer(state, action);
        }

        let reduxStore: ReduxStore<AppState, Action> = createStore(app);
        const mount = createMountPoint(
            reduxStore,
            s => s.managedByFassade,
            (s, l) => ({...s, managedByFassade: l})
        );

        class MyCommands extends Commands<ManagedByFassadeState> {
            inc(by: number) {
                this.state.val += by;
            }
        }

        class MyFassade extends Fassade<ManagedByFassadeState, MyCommands> {

            getName() {
                return "MyFassade";
            }

            createCommands() {
                return new MyCommands();
            }

            action() {
                this.commands.inc(100);
            }
        }

        const myFassade = new MyFassade(mount);
        myFassade.action();

        assert.deepEqual(reduxStore.getState(), {
            someValue: 0,
            managedByFassade: {
                val: 110
            }
        });
    });

    it("ID must be unique", function () {
        let [, mount] = createReduxWithMountPoint({});

        class TestFassade extends Fassade<any, any> {
            createCommands() {
                return new Commands();
            }
        }

        const tf1 = new TestFassade(mount);
        const tf2 = new TestFassade(mount);
        assert.notEqual(tf1.fassadeId, tf2.fassadeId);
    });

    it("select()", function () {
        class TestCommands extends Commands<{n1: number}> {
            inc() {
                this.state.n1++;
            }
        }

        class TestFassade extends Fassade<{n1: number}, TestCommands> {
            createCommands() {
                return new TestCommands();
            }
            actionInc() {
                this.commands.inc();
            }
        }

        let [, mount] = createReduxWithMountPoint({n1: 0});
        const store = new TestFassade(mount);
        let collected = collect(store.select().unbounded());
        store.actionInc();
        store.actionInc();

        collected.assert({n1: 0}, {n1: 1}, {n1: 2});
    });

    /*
        it("select(with selector)", async function () {
            class TestMutator extends Mutator<{ n1: number }> {
                inc() {
                    this.state.n1++;
                }
            }

            class TestStore extends Store<TestMutator, { n1: number }> {
                actionInc() {
                    this.mutate.inc();
                }
            }

            const store = new TestStore("", new TestMutator(), {n1: 0});
            let collected = collect(store.select(s => s.n1).unbounded());
            store.actionInc();
            store.actionInc();

            await afterAllStoreEvents(store);

            collected.assert(0, 1, 2);
        });

        it("selectNonNil(with selector)", async function () {
            class TestMutator extends Mutator<{ n1?: number }> {
                inc() {
                    this.state.n1 = !isNil(this.state.n1) ? this.state.n1 + 1 : 1;
                }

                clear() {
                    this.state.n1 = undefined;
                }
            }

            class TestStore extends Store<TestMutator, { n1?: number }> {
                actionInc() {
                    this.mutate.inc();
                }

                actionClear() {
                    this.mutate.clear();
                }
            }

            const store = new TestStore("", new TestMutator(), {n1: undefined});
            let collected = collect(store.selectNonNil(s => s.n1).unbounded());
            store.actionInc(); // 1
            store.actionClear();
            store.actionInc(); // 1
            store.actionInc(); // 2
            store.actionClear();
            store.actionInc(); // 1

            await afterAllStoreEvents(store);

            collected.assert(1, 1, 2, 1);
        });

        it("select(with selector return an Arrays) only emits values when the content of the array changes", async function () {
            class TestMutator extends Mutator<{ a: number; b: number; c: number }> {
                incAB() {
                    this.state.count++;
                    this.state.b++;
                }

                incC() {
                    this.state.c++;
                }
            }

            class TestStore extends Store<TestMutator, { a: number; b: number; c: number }> {
                actionIncAB() {
                    this.mutate.incAB();
                }

                actionIncC() {
                    this.mutate.incC();
                }
            }

            const store = new TestStore("", new TestMutator(), {count: 0, b: 10, c: 100});
            let collected = collect(store.select(s => [s.count, s.b]).unbounded());
            store.actionIncAB();
            store.actionIncC();
            store.actionIncAB();
            store.actionIncC();

            await afterAllStoreEvents(store);

            collected.assert([0, 10], [1, 11], [2, 12]);
        });

        it("select(with selector return an object) only emits values when the content of the object changes", async function () {
            class TestMutator extends Mutator<{ a: number; b: number; c: number }> {
                incAB() {
                    this.state.count++;
                    this.state.b++;
                }

                incC() {
                    this.state.c++;
                }
            }

            class TestStore extends Store<TestMutator, { a: number; b: number; c: number }> {
                actionIncAB() {
                    this.mutate.incAB();
                }

                actionIncC() {
                    this.mutate.incC();
                }
            }

            const store = new TestStore("", new TestMutator(), {count: 0, b: 10, c: 100});
            let collected = collect(store.select(s => {
                return {
                    count: s.count,
                    b: s.b
                };
            }).unbounded());
            store.actionIncAB();
            store.actionIncC(); // should not trigger select()
            store.actionIncAB();
            store.actionIncC(); // should not trigger select()

            await afterAllStoreEvents(store);

            collected.assert(
                {count: 0, b: 10},
                {count: 1, b: 11},
                {count: 2, b: 12},
            );
        });

        it("select() only triggers when the selected value deeply changed" +
            "", async function () {
            class TestMutator extends Mutator<{ root: { child: { val1: number } } }> {
                dummy() {
                }
            }

            class TestStore extends Store<TestMutator, { root: { child: { val1: number } } }> {
                action() {
                    this.mutate.dummy();
                }
            }

            const state = {root: {child: {val1: 1}}};
            const store = new TestStore("", new TestMutator(), state);
            let collected = collect(store.select(s => s.root).unbounded());
            store.action(); // should not trigger select()
            store.action(); // should not trigger select()
            store.action(); // should not trigger select()

            await afterAllStoreEvents(store);

            collected.assert(
                state.root
            );
        });

        it("select() gets called on every `.mutate...` method invocation", async function () {
            class MyState {
                count = 0;
            }

            class MyMutators extends Mutator<MyState> {
                increment() {
                    this.state.count++;
                }

                decrement() {
                    this.state.count--;
                }
            }

            class MyStore extends Store<MyMutators, MyState> {
                action() {
                    this.mutate.increment();
                    this.mutate.increment();
                    this.mutate.decrement();
                }
            }

            const store = new MyStore("myStore", new MyMutators(), new MyState());
            let collected = collect(store.select(s => s.count).unbounded());
            store.action();

            await afterAllStoreEvents(store);

            collected.assert(0, 1, 2, 1);
        });

        it("keeps state between action invocations", function () {
            class MyState {
                list: number[] = [];
                value?: number;
            }

            class MyMutators extends Mutator<MyState> {
                setList(list: number[]) {
                    this.state.list = list;
                }

                setValue(value: number) {
                    this.state.value = value;
                }
            }

            class MyStore extends Store<MyMutators, MyState> {
                setList() {
                    this.mutate.setList([1, 2, 3]);
                }

                setValue() {
                    this.mutate.setValue(99);
                }
            }

            const store = new MyStore("myStore", new MyMutators(), new MyState());
            store.setList();
            store.setValue();

            assert.deepEqual(store.state.list, [1, 2, 3]);
            assert.equal(store.state.value, 99);
        });

        it("keeps state between action async invocations", async function () {
            class MyState {
                list: number[] = [];
                value?: number;
            }

            class MyMutators extends Mutator<MyState> {
                setList(list: number[]) {
                    this.state.list = list;
                }

                setValue(value: number) {
                    assert.deepEqual(this.state.list, [1, 2, 3]);
                    this.state.value = value;
                }
            }

            class MyStore extends Store<MyMutators, MyState> {
                async setList() {
                    const list = await createAsyncPromise([1, 2, 3]);
                    this.mutate.setList(list);
                }

                async setValue() {
                    const value = await createAsyncPromise(99);
                    this.mutate.setValue(value);
                }
            }

            const store = new MyStore("myStore", new MyMutators(), new MyState());
            await store.setList();
            await store.setValue();

            assert.deepEqual(store.state.list, [1, 2, 3]);
            assert.equal(store.state.value, 99);
        });

        it("emits MutatorEvents in the correct order when re-entrant code exists", async function () {
            class TestMutator extends Mutator<{ list1: number[], list2: number[] }> {
                setList1(list: number[]) {
                    this.state.list1 = list;
                }

                setList2(list: number[]) {
                    this.state.list2 = list;
                }
            }

            class TestStore extends Store<TestMutator, { list1: number[], list2: number[] }> {

                private counter = 0;

                constructor() {
                    super("test", new TestMutator(), {list1: [], list2: []});

                    this.processedActions$
                        .pipe(
                            map(event => event.state.list1),
                            distinctUntilChanged((val1, val2) => areArraysShallowEquals(val1, val2))
                        )
                        .subscribe(list1 => {
                            this.mutate.setList2([...this.state.list2, list1.length]);
                        });
                }

                action() {
                    this.mutate.setList1([
                        this.counter++,
                    ]);
                }
            }

            const store = new TestStore();

            const events: any[] = [];
            store.processedActions$.subscribe(event => {
                events.push([event.mutatorAction.type, event.state]);
            });

            store.action();

            await afterAllStoreEvents(store);

            assert.deepEqual(events, [
                ["@@INIT", {list1: [], list2: []}],
                ["setList1", {list1: [0], list2: []}],
                ["setList2", {list1: [0], list2: [0]}],
                ["setList2", {list1: [0], list2: [0, 1]}],
            ]);
        });

        it("destroy() completes processedActions$ observable", function (done) {
            class TestStore extends Store<Mutator<any>, { n1: number }> {
            }

            const store = new TestStore("", new Mutator(), {n1: 0});
            store.processedActions$.subscribe(NOOP, NOOP, done);
            store.destroy();
        });

        it("destroy() completes observable returned by select()", function (done) {
            class TestStore extends Store<Mutator<any>, { n1: number }> {
            }

            const store = new TestStore("", new Mutator(), {n1: 0});
            store.select().unbounded().subscribe(NOOP, NOOP, done);
            store.destroy();
        });

        it("destroy() completes observable returned by selectNonNil()", function (done) {
            class TestStore extends Store<Mutator<any>, { n1: number }> {
            }

            const store = new TestStore("", new Mutator(), {n1: 0});
            store.selectNonNil(s => s).unbounded().subscribe(NOOP, NOOP, done);
            store.destroy();
        });
    */

});
