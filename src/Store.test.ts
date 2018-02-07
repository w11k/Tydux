import {assert} from "chai";
import {enableTyduxDevelopmentMode} from "./development";
import {Mutators} from "./mutators";
import {createSimpleStore} from "./SimpleStore";
import {Store} from "./Store";
import {collect, createAsyncPromise} from "./test-utils";


describe("Store", function () {

    beforeEach(function () {
        enableTyduxDevelopmentMode();
    });

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

        const store = new MyStore("myStore", new MyMutators(), new MyState());

        // directly query the state
        log("query", store.state.count);

        // observe the state
        store.select(s => s.count).unbounded().subscribe(count => {
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

    it("select()", function () {
        class TestMutator extends Mutators<{ n1: number }> {
            inc() {
                this.state.n1++;
            }
        }

        const store = createSimpleStore("", new TestMutator(), {n1: 0});
        let collected = collect(store.select().unbounded());
        store.inc();
        store.inc();
        collected.assert({n1: 0}, {n1: 1}, {n1: 2});
    });

    it("select(with selector)", function () {
        class TestMutator extends Mutators<{ n1: number }> {
            inc() {
                this.state.n1++;
            }
        }

        const store = createSimpleStore("", new TestMutator(), {n1: 0});
        let collected = collect(store.select(s => s.n1).unbounded());
        store.inc();
        store.inc();
        collected.assert(0, 1, 2);
    });

    it("selectNonNil(with selector)", function () {
        class TestMutator extends Mutators<{ n1?: number }> {
            inc() {
                this.state.n1 = this.state.n1 ? this.state.n1 + 1 : 1;
            }

            clear() {
                this.state.n1 = undefined;
            }
        }

        const store = createSimpleStore("", new TestMutator(), {n1: undefined} as { n1?: number });
        let collected = collect(store.selectNonNil(s => s.n1).unbounded());
        store.inc(); // 1
        store.clear();
        store.inc(); // 1
        store.inc(); // 2
        store.clear();
        store.inc(); // 1
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

        const store = createSimpleStore("", new TestMutator(), {a: 0, b: 10, c: 100});
        let collected = collect(store.select(s => [s.a, s.b]).unbounded());
        store.incAB();
        store.incC();
        store.incAB();
        store.incC();
        collected.assert([0, 10], [1, 11], [2, 12]);
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
        let collected = collect(store.select(s => s.count).unbounded());
        store.action();
        collected.assert(0, 1, 2, 1);

    });

    it("member method can use async/await", function (done) {
        class MyState {
            count = 0;
        }

        class MyMutators extends Mutators<MyState> {
            incrementBy(by: number) {
                this.state.count += by;
            }
        }

        class MyStore extends Store<MyMutators, MyState> {
            async action() {
                this.mutate.incrementBy(1);
                const by = await createAsyncPromise(10);
                this.mutate.incrementBy(by);
                collected.assert(0, 1, 11);
                done();
            }
        }

        const store = new MyStore("myStore", new MyMutators(), new MyState());
        let collected = collect(store.select(s => s.count).unbounded());
        store.action();
    });

    it("member method can use member variables", function () {
        class MyStore extends Store<any, any> {

            counterA?: number;

            counterB = 1;

            action() {
                this.counterA = 10;
                this.innerAction();
            }

            private innerAction() {
                this.counterB = 20;
            }
        }

        const store = new MyStore("myStore", {}, {});
        store.action();
        assert.equal(store.counterA, 10);
        assert.equal(store.counterB, 20);
    });

    it("member method can use async/await and instance variables", function (done) {
        class MyStore extends Store<any, any> {

            counter = 0;

            async action() {
                this.counter = 10;
                await createAsyncPromise(10);
                this.counter++;

                setTimeout(() => {
                    assert.equal(this.counter, 11);
                    done();
                }, 0);

            }
        }

        const store = new MyStore("myStore", {}, {});
        store.action();
    });

    it("member methods and invoked sibling methods access the same instance variables", function () {
        class MyStore extends Store<any, any> {

            counter = 0;

            action() {
                this.counter = 10;
                this.check();
            }

            private check() {
                assert.equal(this.counter, 10);
            }
        }

        const store = new MyStore("myStore", {}, {});
        store.action();
    });

    it("member method can use async/await and call sibling methods", function (done) {
        class MyStore extends Store<any, any> {

            chars = "A";

            async action() {
                this.chars += "B";
                this.append();
                await createAsyncPromise(10);
                this.chars += "C";
                this.append();
                this.chars += "E";

                setTimeout(() => {
                    assert.equal(this.chars, "ABXCXE");
                    done();
                }, 0);
            }

            private append() {
                this.chars += "X";
            }
        }

        const store = new MyStore("myStore", {}, {});
        store.action();
    });

});
