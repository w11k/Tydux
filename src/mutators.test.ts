import {enableTyduxDevelopmentMode} from "./development";
import {Mutators} from "./mutators";
import {createSimpleStore} from "./SimpleStore";
import {Store} from "./Store";
import {collect, createAsyncPromise} from "./test-utils";


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
        store.mod1();
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
        store.mod1();
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
        store.mod1();
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
        assert.throws(() => store.mut1());
        assert.equal(store.state.a, 0);
    });

    it("member method can use member variables", function (done) {
        class MyMutators extends Mutators<any> {

            counterA?: number;

            counterB = 1;

            method() {
                this.counterA = 10;
                this.innerMethod();
            }

            innerMethod() {
                this.counterB = 20;
            }
        }

        class MyStore extends Store<MyMutators, any> {
            action() {
                this.mutate.method();
                assert.equal(this.mutate.counterA, 10);
                assert.equal(this.mutate.counterB, 20);
                done();
            }
        }

        const store = new MyStore("myStore", new MyMutators(), {});
        store.action();
    });

});
