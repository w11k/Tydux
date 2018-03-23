import {assert} from "chai";
import * as _ from "lodash";
import {enableTyduxDevelopmentMode} from "./development";
import {resetTydux} from "./global-state";
import {Mutators} from "./mutators";
import {Store} from "./Store";
import {collect, createAsyncPromise} from "./test-utils";


describe("Store", function () {

    beforeEach(() => enableTyduxDevelopmentMode());

    afterEach(() => resetTydux());

    it("documentation", function () {
        // collect output
        const output: string[] = [];
        const log = (...msgs: any[]) => output.push(msgs.join(" "));

        class MyState {
            count = 0;
        }

        class MyMutators extends Mutators<MyState> {
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

        const store = new MyStore("myStore", MyMutators, new MyState());

        // directly query the state
        log("query", store.state.count);

        // observe the state
        store.select(s => s.count).asObservable().subscribe(count => {
            log("observe", count);
        });

        // dispatch actions
        store.action();

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

        new TestStore("s1", {}, {});
        new TestStore("s2", {}, {});
        assert.throws(() => {
            new TestStore("s2", {}, {});
        });
    });

    it("select()", function () {
        class TestMutator extends Mutators<{ n1: number }> {
            inc() {
                this.state.n1++;
            }
        }

        class TestStore extends Store<TestMutator, { n1: number }> {
            actionInc() {
                this.mutate.inc();
            }
        }

        const store = new TestStore("", TestMutator, {n1: 0});
        let collected = collect(store.select().asObservable());
        store.actionInc();
        store.actionInc();
        collected.assert({n1: 0}, {n1: 1}, {n1: 2});
    });

    it("select(with selector)", function () {
        class TestMutator extends Mutators<{ n1: number }> {
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
        let collected = collect(store.select(s => s.n1).asObservable());
        store.actionInc();
        store.actionInc();
        collected.assert(0, 1, 2);
    });

    it("selectNonNil(with selector)", function () {
        class TestMutator extends Mutators<{ n1?: number }> {
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
        let collected = collect(store.selectNonNil(s => s.n1).asObservable());
        store.actionInc(); // 1
        store.actionClear();
        store.actionInc(); // 1
        store.actionInc(); // 2
        store.actionClear();
        store.actionInc(); // 1
        collected.assert(1, 1, 2, 1);
    });

    it("select(with selector return an Arrays) only emits values when the content of the array changes", function () {
        class TestMutator extends Mutators<{ a: number; b: number; c: number }> {
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
        let collected = collect(store.select(s => [s.a, s.b]).asObservable());
        store.actionIncAB();
        store.actionIncC();
        store.actionIncAB();
        store.actionIncC();
        collected.assert([0, 10], [1, 11], [2, 12]);
    });

    it("select(with selector return an object) only emits values when the content of the object changes", function () {
        class TestMutator extends Mutators<{ a: number; b: number; c: number }> {
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
        }).asObservable());
        store.actionIncAB();
        store.actionIncC();
        store.actionIncAB();
        store.actionIncC();
        collected.assert(
            {a: 0, b: 10},
            {a: 1, b: 11},
            {a: 2, b: 12},
        );
    });

    it("select() gets called on every `.mutate...` method invocation", function () {
        class MyState {
            count = 0;
        }

        class MyMutators extends Mutators<MyState> {
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
        let collected = collect(store.select(s => s.count).asObservable());
        store.action();
        collected.assert(0, 1, 2, 1);
    });

    it("keeps state between action invocations", function () {
        class MyState {
            list: number[] = [];
            value?: number;
        }

        class MyMutators extends Mutators<MyState> {
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

        class MyMutators extends Mutators<MyState> {
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

});
