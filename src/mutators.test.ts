import {assert} from "chai";
import {enableTyduxDevelopmentMode} from "./development";
import {Mutators} from "./mutators";
import {Store} from "./Store";


describe("Mutators", function () {

    beforeEach(function () {
        enableTyduxDevelopmentMode();
    });

    it("methods can change the state", function () {
        class TestMutator extends Mutators<{ n1: number }> {
            mut1() {
                this.state.n1 = 1;
            }
        }

        class MyStore extends Store<TestMutator, { n1: number }> {
            action() {
                this.mutate.mut1();
            }
        }

        const store = new MyStore("", new TestMutator(), {n1: 0});
        store.action();
        assert.deepEqual(store.state, {n1: 1});
    });

    it("methods can assign a new state", function () {
        class TestMutator extends Mutators<{ n1: number }> {
            mut1() {
                this.state = {
                    n1: 1
                };
            }
        }

        class MyStore extends Store<TestMutator, { n1: number }> {
            action() {
                this.mutate.mut1();
            }
        }

        const store = new MyStore("", new TestMutator(), {n1: 0});
        store.action();
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

        class TestStore extends Store<TestMutator, { n1: string }> {
            action1() {
                this.mutate.mod1();
            }
        }

        const store = new TestStore("TestStore", new TestMutator(), {n1: ""});
        store.action1();
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

        class MyStore extends Store<TestMutator, { a: number }> {
            action() {
                this.mutate.mut1();
            }
        }

        const store = new MyStore("", new TestMutator(), {a: 0});
        assert.throws(() => store.action());
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
