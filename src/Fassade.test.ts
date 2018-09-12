import {assert} from "chai";
import {Action, createStore, Store as ReduxStore} from "redux";
import {distinctUntilChanged, map} from "rxjs/operators";
import {Commands} from "./commands";
import {Fassade} from "./Fassade";
import {createTyduxStoreBridge} from "./store";
import {collect, createAsyncPromise, createTestMount, dispatchedAllActions} from "./test-utils";
import {areArraysShallowEquals, isNil} from "./utils";


describe("Fassade", function () {

    it("ID must be unique", function () {
        const mount = createTestMount({});

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
        class TestCommands extends Commands<{ n1: number }> {
            inc() {
                this.state.n1++;
            }
        }

        class TestFassade extends Fassade<{ n1: number }, TestCommands> {
            createCommands() {
                return new TestCommands();
            }

            actionInc() {
                this.commands.inc();
            }
        }

        const mount = createTestMount({n1: 0});
        const store = new TestFassade(mount);
        let collected = collect(store.select().unbounded());
        store.actionInc();
        store.actionInc();

        collected.assert({n1: 0}, {n1: 1}, {n1: 2});
    });

    it("select(with selector)", function () {
        class TestCommands extends Commands<{ n1: number }> {
            inc() {
                this.state.n1++;
            }
        }

        class TestFassade extends Fassade<{ n1: number }, TestCommands> {
            createCommands() {
                return new TestCommands();
            }

            actionInc() {
                this.commands.inc();
            }
        }

        const store = new TestFassade(createTestMount({n1: 0}));
        let collected = collect(store.select(s => s.n1).unbounded());
        store.actionInc();
        store.actionInc();

        collected.assert(0, 1, 2);
    });

    it("selectNonNil(with selector)", function () {
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

        class TestFassade extends Fassade<TestState, TestCommands> {
            createCommands() {
                return new TestCommands();
            }

            actionInc() {
                this.commands.inc();
            }

            actionClear() {
                this.commands.clear();
            }
        }

        const mount = createTestMount<TestState>({n1: undefined});
        const store = new TestFassade(mount);
        let collected = collect(store.selectNonNil(s => s.n1).unbounded());
        store.actionInc(); // 1
        store.actionClear();
        store.actionInc(); // 1
        store.actionInc(); // 2
        store.actionClear();
        store.actionInc(); // 1

        collected.assert(1, 1, 2, 1);
    });

    it("select(with selector return an Arrays) only emits values when the content of the array changes", function () {
        class TestCommands extends Commands<{ a: number; b: number; c: number }> {
            incAB() {
                this.state.a++;
                this.state.b++;
            }

            incC() {
                this.state.c++;
            }
        }

        class TestFassade extends Fassade<{ a: number; b: number; c: number }, TestCommands> {
            createCommands() {
                return new TestCommands();
            }

            actionIncAB() {
                this.commands.incAB();
            }

            actionIncC() {
                this.commands.incC();
            }
        }

        const store = new TestFassade(createTestMount({a: 0, b: 10, c: 100}));
        let collected = collect(store.select(s => [s.a, s.b]).unbounded());
        store.actionIncAB();
        store.actionIncC();
        store.actionIncAB();
        store.actionIncC();

        collected.assert([0, 10], [1, 11], [2, 12]);
    });

    it("select(with selector return an object) only emits values when the content of the object changes", function () {
        class TestCommands extends Commands<{ a: number; b: number; c: number }> {
            incAB() {
                this.state.a++;
                this.state.b++;
            }

            incC() {
                this.state.c++;
            }
        }

        class TestFassade extends Fassade<{ a: number; b: number; c: number }, TestCommands> {
            createCommands() {
                return new TestCommands();
            }

            actionIncAB() {
                this.commands.incAB();
            }

            actionIncC() {
                this.commands.incC();
            }
        }

        const store = new TestFassade(createTestMount({a: 0, b: 10, c: 100}));
        let collected = collect(store.select(s => {
            return {
                a: s.a,
                b: s.b
            };
        }).unbounded());
        store.actionIncAB();
        store.actionIncC(); // should not trigger select()
        store.actionIncAB();
        store.actionIncC(); // should not trigger select()

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

        class TestFassade extends Fassade<{ root: { child: { val1: number } } }, TestCommands> {
            createCommands() {
                return new TestCommands();
            }

            action() {
                this.commands.dummy();
            }
        }

        const state = {root: {child: {val1: 1}}};
        const store = new TestFassade(createTestMount(state));
        let collected = collect(store.select(s => s.root).unbounded());
        store.action(); // should not trigger select()
        store.action(); // should not trigger select()
        store.action(); // should not trigger select()

        collected.assert(
            state.root
        );
    });

    it("select() gets called on every `.command...` method invocation", function () {
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

        class TestFassade extends Fassade<TestState, TestCommands> {
            createCommands() {
                return new TestCommands();
            }

            action() {
                this.commands.increment();
                this.commands.increment();
                this.commands.decrement();
            }
        }

        const store = new TestFassade(createTestMount(new TestState()));
        let collected = collect(store.select(s => s.count).unbounded());
        store.action();

        collected.assert(0, 1, 2, 1);
    });

    it("keeps state between action invocations", function () {
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

        class TestFasade extends Fassade<TestState, TestCommands> {
            createCommands() {
                return new TestCommands();
            }

            setList() {
                this.commands.setList([1, 2, 3]);
            }

            setValue() {
                this.commands.setValue(99);
            }
        }


        const store = new TestFasade(createTestMount(new TestState()));
        store.setList();
        store.setValue();

        assert.deepEqual(store.state.list, [1, 2, 3]);
        assert.equal(store.state.value, 99);
    });

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

        class TestFassade extends Fassade<TestState, TestCommands> {
            createCommands() {
                return new TestCommands();
            }

            async setList() {
                const list = await createAsyncPromise([1, 2, 3]);
                this.commands.setList(list);
            }

            async setValue() {
                const value = await createAsyncPromise(99);
                this.commands.setValue(value);
            }
        }

        const store = new TestFassade(createTestMount(new TestState()));
        await store.setList();
        await store.setValue();

        assert.deepEqual(store.state.list, [1, 2, 3]);
        assert.equal(store.state.value, 99);
    });

    it("emits CommandsEvents in the correct order when re-entrant code exists", async function () {

        const initialState = {
            list1: [] as number[],
            list2: [] as number[]
        };

        let events: any[] = [];
        function plainReducer(state = initialState, action: any) {
            events.push([action.type, state]);
            return state;
        }

        const tyduxBridge = createTyduxStoreBridge();
        const reduxStore: ReduxStore<typeof initialState, Action> = createStore(tyduxBridge.wrapReducer(plainReducer));
        const mount = tyduxBridge.createMountPoint(reduxStore, s => s, (_, s) => ({...s}));

        class TestCommands extends Commands<{ list1: number[], list2: number[] }> {
            setList1(list: number[]) {
                this.state.list1 = list;
            }

            setList2(list: number[]) {
                this.state.list2 = list;
            }
        }

        class TestFassade extends Fassade<{ list1: number[], list2: number[] }, TestCommands> {

            private counter = 0;

            constructor() {
                super(mount);

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

            getName() {
                return "";
            }

            createCommands() {
                return new TestCommands();
            }

            action() {
                this.commands.setList1([
                    this.counter++,
                ]);
            }
        }

        const fassade = new TestFassade();
        fassade.action();

        await dispatchedAllActions(fassade);

        events = events.slice(1);
        console.log(JSON.stringify(events));


        assert.deepEqual(events, [
        //     ["@@INIT", {list1: [], list2: []}],
            [" / setList1", {list1: [0], list2: []}],
        //     ["setList2", {list1: [0], list2: [0]}],
        //     ["setList2", {list1: [0], list2: [0, 1]}],
        ]);
    });
    /*

    it("destroy() completes processedActions$ observable", function (done) {
        class TestFassade extends Fassade<Commands<any>, { n1: number }> {
        }

        const store = new TestFassade("", new Commands(), {n1: 0});
        store.processedActions$.subscribe(NOOP, NOOP, done);
        store.destroy();
    });

    it("destroy() completes observable returned by select()", function (done) {
        class TestFassade extends Fassade<Commands<any>, { n1: number }> {
        }

        const store = new TestFassade("", new Commands(), {n1: 0});
        store.select().unbounded().subscribe(NOOP, NOOP, done);
        store.destroy();
    });

    it("destroy() completes observable returned by selectNonNil()", function (done) {
        class TestFassade extends Fassade<Commands<any>, { n1: number }> {
        }

        const store = new TestFassade("", new Commands(), {n1: 0});
        store.selectNonNil(s => s).unbounded().subscribe(NOOP, NOOP, done);
        store.destroy();
    });
*/

});
