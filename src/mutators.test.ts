import {enableTyduxDevelopmentMode} from "./development";
import {Mutators} from "./mutators";
import {createSimpleStore} from "./SimpleStore";


describe("Mutators", function () {

    beforeEach(function () {
        enableTyduxDevelopmentMode();
    });

    it("methods can change the state", function () {
        class TestMutator extends Mutators<{ n1: number }> {
            mod1() {
                this.state.n1 = 1;
            }
        }

        const store = createSimpleStore("", new TestMutator(), {n1: 0});
        store.mutate.mod1();
        assert.deepEqual(store.state, {n1: 1});
    });

    it("methods can assign a new state", function () {
        class TestMutator extends Mutators<{ n1: number }> {
            mod1() {
                this.state = {
                    n1: 1
                };
            }
        }

        const store = createSimpleStore("", new TestMutator(), {n1: 0});
        store.mutate.mod1();
        assert.deepEqual(store.state, {n1: 1});
    });

    it("nested methods are merged", function () {
        class TestMutator extends Mutators<{ n1: string }> {
            mod1() {
                this.state.n1 += "1";
                this.mod2();
                this.mod3();
            }

            mod2() {
                this.state.n1 += "2";
            }

            mod3() {
                this.state.n1 += "3";
            }
        }

        const store = createSimpleStore("", new TestMutator(), {n1: ""});
        store.mutate.mod1();
        assert.deepEqual(store.state, {n1: "123"});
    });

    it("state changes are only persistent if the mutator did not throw an exception", function () {
        class TestMutator extends Mutators<any> {
            mut1() {
                this.state.a = 1;
                if (this.state.a > 0) {
                    throw new Error("");
                }
                this.state.a = 2;
            }
        }

        const store = createSimpleStore("", new TestMutator(), {a: 0});
        assert.throws(() => store.mutate.mut1());
        assert.equal(store.state.a, 0);
    });

});
