import {Action, createStore, Store as ReduxStore} from "redux";
import {distinctUntilChanged, map} from "rxjs/operators";
import {createAsyncPromise, createTestMount} from "../testing";
import {collect} from "../testing/test-utils-internal";
import {Commands} from "./commands";
import {Facade} from "./Facade";
import {MountPoint, TyduxReducerBridge, TyduxStore} from "./store";
import {areArraysShallowEquals, untilNoBufferedStateChanges} from "./utils";


describe("Facade", () => {

    it("ID must be unique", () => {
        const mount = createTestMount({});

        class TestFacade extends Facade<any, any> {
        }

        const tf1 = new TestFacade(mount, "TestFacade", Commands);
        const tf2 = new TestFacade(mount, "TestFacade", Commands);
        expect(tf1.facadeId).not.toEqual(tf2.facadeId);
    });

    it("can be destroyed", () => {
        const mount = createTestMount({});
        let called = false;

        class TestFacade extends Facade<any, any> {
            constructor(mountPoint: MountPoint<any, any>, name: string, commands: any) {
                super(mountPoint, name, commands);
                this.destroyed.subscribe(() => called = true);
            }
        }

        const facade = new TestFacade(mount, "TestFacade", Commands);
        facade.destroy();
        expect(called).toBe(true);
    });

    it("select()", async () => {
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
        }).subscribe();

        facade.actionInc();
        facade.actionInc();

        await untilNoBufferedStateChanges(facade);

        expect(values).toEqual([
            {n1: 0},
            {n1: 1},
            {n1: 2},
        ]);
    });

    it("select(with selector)", async () => {
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
        const collected = collect(facade.select(s => s.n1));
        facade.actionInc();
        facade.actionInc();

        await untilNoBufferedStateChanges(facade);
        collected.assert(0, 1, 2);
    });

    it("select(with selector return an Arrays) only emits values when the content of the array changes", async () => {
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
        const collected = collect(facade.select(s => [s.a, s.b]));
        facade.actionIncAB();
        facade.actionIncC();
        facade.actionIncAB();
        facade.actionIncC();

        await untilNoBufferedStateChanges(facade);
        collected.assert([0, 10], [1, 11], [2, 12]);
    });

    it("select(with selector return an object) only emits values when the content of the object changes", async () => {
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
        const collected = collect(facade.select(s => {
            return {
                a: s.a,
                b: s.b
            };
        }));
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

    it("select() only triggers when the selected value deeply changed", () => {
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
        const collected = collect(store.select(s => s.root));
        store.action(); // should not trigger select()
        store.action(); // should not trigger select()
        store.action(); // should not trigger select()

        collected.assert(
            state.root
        );
    });

    it("select() gets called on every `.command...` method invocation", async () => {
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
        const collected = collect(facade.select(s => s.count));
        facade.action();

        await untilNoBufferedStateChanges(facade);
        collected.assert(0, 1, 2, 1);
    });

    it("keeps state between action invocations", async () => {
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
        expect(facade.state.list).toEqual([1, 2, 3]);
        expect(facade.state.value).toEqual(99);
    });

    it("state changes are directly reflected in the facade state", done => {
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
                expect(this.state.value).toEqual(9);
                done();
            }
        }

        const facade = new TestFacade(createTestMount(new TestState()), "TestFacade", new TestCommands());
        facade.met1();
    });

    it("should provide an overloaded constructor to pass TyduxStore instead of mount point", () => {
        class TestState {
        }

        class TestCommands extends Commands<TestState> {
        }

        class TestFacade extends Facade<TestState, TestCommands> {
        }

        const tyduxBridge = new TyduxReducerBridge();
        const reduxStore = createStore(tyduxBridge.createTyduxReducer(), {});
        const tydux = tyduxBridge.connectStore(reduxStore);

        const facade = new TestFacade(tydux, "test", new TestCommands(), new TestState());

        expect(reduxStore.getState()).toEqual({test: {}});

        expect(facade.state).toEqual({});
    });

    it("can set their initial state during super call", () => {
        type TestState = { value: number };

        class TestFacade extends Facade<TestState, Commands<TestState>> {
            constructor(tydux: TyduxStore<any>) {
                super(tydux.createRootMountPoint("test"), "test", new Commands(), {value: 0});

            }
        }

        const tyduxBridge = new TyduxReducerBridge();
        const reduxStore = createStore(tyduxBridge.createTyduxReducer({global: true}));
        const tydux = tyduxBridge.connectStore(reduxStore);
        const facade = new TestFacade(tydux);

        expect(reduxStore.getState()).toEqual({
            global: true,
            test: {
                value: 0
            }
        } as any);

        expect(facade.state).toEqual({
            value: 0
        });
    });

    it("can set their initial state during super call with a function", () => {

        type TestState = { value: number };

        class TestFacade extends Facade<TestState, Commands<TestState>> {
            constructor(tydux: TyduxStore<any>) {
                super(tydux.createRootMountPoint("test"), "test", new Commands(), () => ({value: 99}));

            }
        }

        const tyduxBridge = new TyduxReducerBridge();
        const reduxStore = createStore(tyduxBridge.createTyduxReducer({global: true}));
        const tydux = tyduxBridge.connectStore(reduxStore);
        const facade = new TestFacade(tydux);

        expect(reduxStore.getState()).toEqual({
            global: true,
            test: {
                value: 99
            }
        } as any);

        expect(facade.state).toEqual({
            value: 99
        });
    });

    it("can set their initial state during super call with a proise", (done) => {

        type TestState = { value: number };

        const initialValuePromise = new Promise<TestState>(resolve => {
            setTimeout(() => resolve({value: 77}), 0);
        });

        class TestFacade extends Facade<TestState, Commands<TestState>> {
            constructor(tydux: TyduxStore<any>) {
                super(tydux.createRootMountPoint("test"), "test", new Commands(), initialValuePromise);

            }
        }

        const tyduxBridge = new TyduxReducerBridge();
        const reduxStore = createStore(tyduxBridge.createTyduxReducer({global: true}));
        const tydux = tyduxBridge.connectStore(reduxStore);
        const facade = new TestFacade(tydux);

        reduxStore.subscribe(() => {
            expect(reduxStore.getState()).toEqual({
                global: true,
                test: {
                    value: 77
                }
            } as any);

            expect(facade.state).toEqual({
                value: 77
            });

            done();
        });
    });

    it("exceptions in facade methods", () => {
        class TestState {
            s1 = 0;
        }

        class TestCommands extends Commands<TestState> {
            set(s: number) {
                this.state.s1 = s;
            }
        }

        class TestFacade extends Facade<TestState, TestCommands> {
            op() {
                this.commands.set(99);
                throw new Error();
            }
        }

        const store = new TestFacade(createTestMount(new TestState()), "TestFacade", new TestCommands());
        try {
            store.op();
        } catch (e) {
            // ignore
        }

        expect(store.state.s1).toEqual(99);
    });

    it("keeps state between async invocations", async () => {
        class TestState {
            list: number[] = [];
            value?: number;
        }

        class TestCommands extends Commands<TestState> {
            setList(list: number[]) {
                this.state.list = list;
            }

            setValue(value: number) {
                expect(this.state.list).toEqual([1, 2, 3]);
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

        expect(store.state.list).toEqual([1, 2, 3]);
        expect(store.state.value).toEqual(99);
    });

    it("emits CommandsEvents in the correct order when re-entrant code exists", done => {
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

        const states: any[] = [];
        facade.select()
            .subscribe(state => {
                states.push(state);
            });

        setTimeout(() => {
            expect(states).toEqual([
                {list1: [], list2: []},
                {list1: [], list2: [0]},
                {list1: [0], list2: [0]},
                {list1: [0], list2: [0, 1]},
            ]);
            done();
        }, 0);
    });

});
