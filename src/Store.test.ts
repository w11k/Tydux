import { Mutators, Store} from "./Store";
import {collect} from "./test-utils";
import {enableDevelopmentMode} from "./development";
import {createSimpleStore} from "./SimpleStore";


describe("Store", function () {

    beforeEach(function () {
        enableDevelopmentMode();
    });

    it("documentation", function() {
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


        const store = createSimpleStore("myStore", new MyMutators(), new MyState());

        // directly query the state
        console.log("query", store.state.count);

        // observe the state
        store.select(s => s.count).unbounded().subscribe(count => {
            console.log("observe", count);
        });

        // dispatch actions
        store.mutate.increment();
        store.mutate.decrement();
    });

    it("select()", function () {
        class TestMutator extends Mutators<{ n1: number }> {
            inc() {
                this.state.n1++;
            }
        }

        const store = createSimpleStore("", new TestMutator(), {n1: 0});
        let collected = collect(store.select().unbounded());
        store.mutate.inc();
        store.mutate.inc();
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
        store.mutate.inc();
        store.mutate.inc();
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
        store.mutate.inc(); // 1
        store.mutate.clear();
        store.mutate.inc(); // 1
        store.mutate.inc(); // 2
        store.mutate.clear();
        store.mutate.inc(); // 1
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
        store.mutate.incAB();
        store.mutate.incC();
        store.mutate.incAB();
        store.mutate.incC();
        collected.assert([0, 10], [1, 11], [2, 12]);
    });

});
