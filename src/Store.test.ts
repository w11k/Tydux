import {enableDevelopmentMode} from "./devTools";
import {createStore, Mutators, Store} from "./Store";
import {collect} from "./test-utils";


describe("Store", function () {

    beforeEach(function () {
        enableDevelopmentMode();
    });

    it("select()", function () {
        class TestMutator extends Mutators<{ n1: number }> {
            inc() {
                this.state.n1++;
            }
        }

        const store = createStore("", new TestMutator(), {n1: 0});
        let collected = collect(store.select());
        store.dispatch.inc();
        store.dispatch.inc();
        collected.assert({n1: 0}, {n1: 1}, {n1: 2});
    });

    it("select(with selector)", function () {
        class TestMutator extends Mutators<{ n1: number }> {
            inc() {
                this.state.n1++;
            }
        }

        const store = createStore("", new TestMutator(), {n1: 0});
        let collected = collect(store.select(s => s.n1));
        store.dispatch.inc();
        store.dispatch.inc();
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

        const store = createStore("", new TestMutator(), {n1: undefined} as { n1?: number });
        let collected = collect(store.selectNonNil(s => s.n1));
        store.dispatch.inc(); // 1
        store.dispatch.clear();
        store.dispatch.inc(); // 1
        store.dispatch.inc(); // 2
        store.dispatch.clear();
        store.dispatch.inc(); // 1
        collected.assert(1, 1, 2, 1);
    });

});
