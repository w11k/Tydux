import {assert} from "chai";
import {Action, createStore, Store as ReduxStore} from "redux";
import {distinctUntilChanged, map} from "rxjs/operators";
import {Commands} from "./commands";
import {Facade} from "./Facade";
import {TyduxReducerBridge, TyduxStore} from "./store";
import {collect, createAsyncPromise, createTestMount} from "./test-utils";
import {areArraysShallowEquals, isNil, untilNoBufferedStateChanges} from "./utils";


describe("Facade", function () {

    it("ID must be unique", function () {
        const mount = createTestMount({});

        class TestFacade extends Facade<any, any> {
        }

        const tf1 = new TestFacade(mount, "TestFacade", Commands);
        const tf2 = new TestFacade(mount, "TestFacade", Commands);
        assert.notEqual(tf1.facadeId, tf2.facadeId);
    });

   /* it("select()", async function () {
        class TestCommands extends Commands<{ n1: number }> {
            inc() {
                this.state.n1++;
            }
        }

        class TestFacade extends Facade<{ n1: number }, TestCommands> {
            actionInc() {
                this.commands.inc();
            }
        }

        const mount = createTestMount({n1: 0});
        const facade = new TestFacade(mount, "TestFacade", new TestCommands());

        const values: any = [];
        facade.select((currentState) => {
            values.push(currentState);
        }).unbounded().subscribe();

        facade.actionInc();
        facade.actionInc();

        await untilNoBufferedStateChanges(facade);

        assert.deepEqual(values, [
            {n1: 0},
            {n1: 1},
            {n1: 2},
        ]);
    });

    it("select(with selector)", async function () {
        class TestCommands extends Commands<{ n1: number }> {
            inc() {
                this.state.n1++;
            }
        }

        class TestFacade extends Facade<{ n1: number }, TestCommands> {
            actionInc() {
                this.commands.inc();
            }
        }

        const facade = new TestFacade(createTestMount({n1: 0}), "TestFacade", new TestCommands());
        let collected = collect(facade.select(s => s.n1).unbounded());
        facade.actionInc();
        facade.actionInc();

        await untilNoBufferedStateChanges(facade);
        collected.assert(0, 1, 2);
    });

    it("selectNonNil(with selector)", async function () {
        interface TestState {
            n1?: number;
        }

        class TestCommands extends Commands<TestState> {
            inc() {
                this.state.n1 = !isNil(this.state.n1) ? this.state.n1 + 1 : 1;
            }

            clear() {
                this.state.n1 = undefined;
            }
        }

        class TestFacade extends Facade<TestState, TestCommands> {
            actionInc() {
                this.commands.inc();
            }

            actionClear() {
                this.commands.clear();
            }
        }

        const mount = createTestMount<TestState>({n1: undefined});
        const facade = new TestFacade(mount, "TestFacade", new TestCommands());
        let collected = collect(facade.selectNonNil(s => s.n1).unbounded());
        facade.actionInc(); // 1
        facade.actionClear();
        facade.actionInc(); // 1
        facade.actionInc(); // 2
        facade.actionClear();
        facade.actionInc(); // 1

        await untilNoBufferedStateChanges(facade);
        collected.assert(1, 1, 2, 1);
    });

    it("select(with selector return an Arrays) only emits values when the content of the array changes", async function () {
        class TestCommands extends Commands<{ a: number; b: number; c: number }> {
            incAB() {
                this.state.a++;
                this.state.b++;
            }

            incC() {
                this.state.c++;
            }
        }

        class TestFacade extends Facade<{ a: number; b: number; c: number }, TestCommands> {
            actionIncAB() {
                this.commands.incAB();
            }

            actionIncC() {
                this.commands.incC();
            }
        }

        const facade = new TestFacade(createTestMount({a: 0, b: 10, c: 100}), "TestFacade", new TestCommands());
        let collected = collect(facade.select(s => [s.a, s.b]).unbounded());
        facade.actionIncAB();
        facade.actionIncC();
        facade.actionIncAB();
        facade.actionIncC();

        await untilNoBufferedStateChanges(facade);
        collected.assert([0, 10], [1, 11], [2, 12]);
    });

    it("select(with selector return an object) only emits values when the content of the object changes", async function () {
        class TestCommands extends Commands<{ a: number; b: number; c: number }> {
            incAB() {
                this.state.a++;
                this.state.b++;
            }

            incC() {
                this.state.c++;
            }
        }

        class TestFacade extends Facade<{ a: number; b: number; c: number }, TestCommands> {
            actionIncAB() {
                this.commands.incAB();
            }

            actionIncC() {
                this.commands.incC();
            }
        }

        const facade = new TestFacade(createTestMount({a: 0, b: 10, c: 100}), "TestFacade", new TestCommands());
        let collected = collect(facade.select(s => {
            return {
                a: s.a,
                b: s.b
            };
        }).unbounded());
        facade.actionIncAB();
        facade.actionIncC(); // should not trigger select()
        facade.actionIncAB();
        facade.actionIncC(); // should not trigger select()

        await untilNoBufferedStateChanges(facade);
        collected.assert(
            {a: 0, b: 10},
            {a: 1, b: 11},
            {a: 2, b: 12},
        );
    });

    it("select() only triggers when the selected value deeply changed", function () {
        class TestCommands extends Commands<{ root: { child: { val1: number } } }> {
            dummy() {
            }
        }

        class TestFacade extends Facade<{ root: { child: { val1: number } } }, TestCommands> {
            action() {
                this.commands.dummy();
            }
        }

        const state = {root: {child: {val1: 1}}};
        const store = new TestFacade(createTestMount(state), "TestFacade", new TestCommands());
        let collected = collect(store.select(s => s.root).unbounded());
        store.action(); // should not trigger select()
        store.action(); // should not trigger select()
        store.action(); // should not trigger select()

        collected.assert(
            state.root
        );
    });

    it("select() gets called on every `.command...` method invocation", async function () {
        class TestState {
            count = 0;
        }

        class TestCommands extends Commands<TestState> {
            increment() {
                this.state.count++;
            }

            decrement() {
                this.state.count--;
            }
        }

        class TestFacade extends Facade<TestState, TestCommands> {
            action() {
                this.commands.increment();
                this.commands.increment();
                this.commands.decrement();
            }
        }

        const facade = new TestFacade(createTestMount(new TestState()), "TestFacade", new TestCommands());
        let collected = collect(facade.select(s => s.count).unbounded());
        facade.action();

        await untilNoBufferedStateChanges(facade);
        collected.assert(0, 1, 2, 1);
    });

    it("keeps state between action invocations", async function () {
        class TestState {
            list: number[] = [];
            value?: number;
        }

        class TestCommands extends Commands<TestState> {
            setList(list: number[]) {
                this.state.list = list;
            }

            setValue(value: number) {
                this.state.value = value;
            }
        }

        class TestFacade extends Facade<TestState, TestCommands> {
            setList() {
                this.commands.setList([1, 2, 3]);
            }

            setValue() {
                this.commands.setValue(99);
            }
        }


        const facade = new TestFacade(createTestMount(new TestState()), "TestFacade", new TestCommands());
        facade.setList();
        facade.setValue();

        await untilNoBufferedStateChanges(facade);
        assert.deepEqual(facade.state.list, [1, 2, 3]);
        assert.equal(facade.state.value, 99);
    });

    it("state changes are directly reflected in the facade state", function (done) {
        class TestState {
            value = 0;
        }

        class TestCommands extends Commands<TestState> {
            setValue(value: number) {
                this.state.value = value;
            }
        }

        class TestFacade extends Facade<TestState, TestCommands> {
            met1() {
                this.commands.setValue(9);
                assert.equal(this.state.value, 9);
                done();
            }
        }

        const facade = new TestFacade(createTestMount(new TestState()), "TestFacade", new TestCommands());
        facade.met1();
    });

    it("can set their initial state during super call", function () {
        class AppState {
            // noinspection JSUnusedGlobalSymbols
            global = true;
        }

        class TestState {
            value = 0;
        }

        class TestCommands extends Commands<TestState> {
        }

        class TestFacade extends Facade<TestState, TestCommands> {
            constructor(tydux: TyduxStore<any>) {
                super(tydux.createRootMountPoint("test"), "test", new TestCommands(), new TestState());

            }
        }

        const tyduxBridge = new TyduxReducerBridge();
        const reduxStore = createStore(tyduxBridge.createTyduxReducer(new AppState()));
        const tydux = tyduxBridge.connectStore(reduxStore);
        const facade = new TestFacade(tydux);

        assert.deepEqual(
            reduxStore.getState(),
            {
                global: true,
                test: {
                    value: 0
                }
            } as any);

        assert.deepEqual(
            facade.state,
            {
                value: 0
            });
    });

    // it("can use a NamedMountPoint", function () {
    //     class TestState {
    //         value = 0;
    //     }
    //
    //     class TestCommands extends Commands<TestState> {
    //     }
    //
    //     class TestFacade extends Facade<TestState, TestCommands> {
    //         constructor(tydux: TyduxStore<any>) {
    //             super(tydux.createRootMountPoint("test"), new TestCommands());
    //
    //         }
    //     }
    //
    //     const tyduxBridge = new TyduxReducerBridge();
    //     const reduxStore = createStore(tyduxBridge.createTyduxReducer(new TestState()));
    //     const tydux = tyduxBridge.connectStore(reduxStore);
    //     const facade = new TestFacade(tydux);
    //
    //     assert.deepEqual(
    //         reduxStore.getState(),
    //         {
    //             global: true,
    //             test: {
    //                 value: 0
    //             }
    //         } as any);
    //
    //     assert.deepEqual(
    //         facade.state,
    //         {
    //             value: 0
    //         });
    // });

    it("keeps state between async invocations", async function () {
        class TestState {
            list: number[] = [];
            value?: number;
        }

        class TestCommands extends Commands<TestState> {
            setList(list: number[]) {
                this.state.list = list;
            }

            setValue(value: number) {
                assert.deepEqual(this.state.list, [1, 2, 3]);
                this.state.value = value;
            }
        }

        class TestFacade extends Facade<TestState, TestCommands> {
            async setList() {
                const list = await createAsyncPromise([1, 2, 3]);
                this.commands.setList(list);
            }

            async setValue() {
                const value = await createAsyncPromise(99);
                this.commands.setValue(value);
            }
        }

        const store = new TestFacade(createTestMount(new TestState()), "TestFacade", new TestCommands());
        await store.setList();
        await store.setValue();

        assert.deepEqual(store.state.list, [1, 2, 3]);
        assert.equal(store.state.value, 99);
    });

    it("emits CommandsEvents in the correct order when re-entrant code exists", function (done) {
        const initialState = {
            list1: [] as number[],
            list2: [] as number[]
        };

        function plainReducer(state = initialState) {
            return state;
        }

        const tyduxBridge = new TyduxReducerBridge();
        const reduxStore: ReduxStore<typeof initialState, Action> = createStore(tyduxBridge.wrapReducer(plainReducer));
        const connected = tyduxBridge.connectStore(reduxStore);
        const mount = connected.createMountPoint(s => s, (_, s) => ({...s}));

        class TestCommands extends Commands<{ list1: number[], list2: number[] }> {
            setList1(list: number[]) {
                this.state.list1 = list;
            }

            setList2(list: number[]) {
                this.state.list2 = list;
            }
        }

        class TestFacade extends Facade<{ list1: number[], list2: number[] }, TestCommands> {

            private counter = 0;

            constructor() {
                super(mount, "", new TestCommands());

                this.select()
                    .unbounded()
                    .pipe(
                        map(() => this.state.list1),

                        // only trigger when list1 was changed
                        distinctUntilChanged((val1, val2) => areArraysShallowEquals(val1, val2))
                    )
                    .subscribe(list1 => {
                        this.commands.setList2([...this.state.list2, list1.length]);
                    });
            }

            action() {
                this.commands.setList1([
                    this.counter++,
                ]);
            }
        }

        const facade = new TestFacade();
        facade.action();

        let states: any[] = [];
        facade.select().unbounded()
            .subscribe(state => {
                states.push(state);
            });

        setTimeout(() => {
            assert.deepEqual(states, [
                {list1: [], list2: []},
                {list1: [], list2: [0]},
                {list1: [0], list2: [0]},
                {list1: [0], list2: [0, 1]},
            ]);
            done();
        }, 0);
    });
*/
});
