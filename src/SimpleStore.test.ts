import {enableTyduxDevelopmentMode} from "./development";
import {Mutators} from "./mutators";
import {createSimpleStore} from "./SimpleStore";
import {collect} from "./test-utils";


describe("SimpleStore", function () {

    beforeEach(function () {
        enableTyduxDevelopmentMode();
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

});
