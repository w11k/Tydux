import {assert} from "chai";
import * as _ from "lodash";
import {distinctUntilChanged, map} from "rxjs/operators";
import {enableTyduxDevelopmentMode} from "./development";
import {resetTydux} from "./global-state";
import {Mutator} from "./mutator";
import {EmptyMutators} from "./mutator.test";
import {Store} from "./Store";
import {afterAllStoreEvents, collect, createAsyncPromise} from "./test-utils";
import {areArraysShallowEquals} from "./utils";


describe("Store", function () {

    beforeEach(() => enableTyduxDevelopmentMode());

    afterEach(() => resetTydux());

    it("documentation", async function () {
        // collect output
        const output: string[] = [];
        const log = (...msgs: any[]) => output.push(msgs.join(" "));

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

        // directly query the state
        log("query", store.state.count);

        // observe the state
        store.select(s => s.count).unbounded().subscribe(count => {
            log("observe", count);
        });

        // dispatch actions
        store.action();

        await afterAllStoreEvents(store);
        assert.deepEqual(output, [
            "query 0",
            "observe 0",
            "observe 1",
            "observe 2",
            "observe 1"
        ]);
    });

    it("ID must be unique", function () {
        class TestStore extends Store<any, any> {
        }

        new TestStore("s1", new EmptyMutators(), {});
        new TestStore("s2", new EmptyMutators(), {});
        assert.throws(() => {
            new TestStore("s2", new EmptyMutators(), {});
        });
    });

    it("select()", async function () {
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
        let collected = collect(store.select().unbounded());
        store.actionInc();
        store.actionInc();

        await afterAllStoreEvents(store);
        collected.assert({n1: 0}, {n1: 1}, {n1: 2});
    });

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
                this.state.n1 = !_.isNil(this.state.n1) ? this.state.n1 + 1 : 1;
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
                this.state.a++;
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

        const store = new TestStore("", new TestMutator(), {a: 0, b: 10, c: 100});
        let collected = collect(store.select(s => [s.a, s.b]).unbounded());
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
                this.state.a++;
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

        const store = new TestStore("", new TestMutator(), {a: 0, b: 10, c: 100});
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

        await afterAllStoreEvents(store);

        collected.assert(
            {a: 0, b: 10},
            {a: 1, b: 11},
            {a: 2, b: 12},
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

                this.mutatorEvents$
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
        store.mutatorEvents$.subscribe(event => {
            events.push([event.action.type, event.state]);
        });

        store.action();

        await afterAllStoreEvents(store);

        assert.deepEqual(events, [
            ["@@INIT", {list1: [], list2: []}],
            ["test#action / setList1", {list1: [0], list2: []}],
            ["test / setList2", {list1: [0], list2: [0]}],
            ["test / setList2", {list1: [0], list2: [0, 1]}],
        ]);

    });

});
