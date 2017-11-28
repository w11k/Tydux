import {enableDevelopmentMode} from "./development";
import {createSimpleStore} from "./SimpleStore";
import {Mutators} from "./Store";
import {collect} from "./test-utils";


describe("SimpleStore", function () {

    beforeEach(function () {
        enableDevelopmentMode();
    });

    it("select()", function () {
        class TestMutator extends Mutators<{ n1: number }> {
            inc() {
                this.state.n1++;
            }
        }

        const store = createSimpleStore("", new TestMutator(), {n1: 0});
        let collected = collect(store.select());

        store.mutate.inc();
        store.mutate.inc();
        collected.assert({n1: 0}, {n1: 1}, {n1: 2});
    });

});
