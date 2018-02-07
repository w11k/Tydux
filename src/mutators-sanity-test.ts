import {assert} from "chai";
import {enableTyduxDevelopmentMode} from "./development";
import {Mutators} from "./mutators";
import {createSimpleStore} from "./SimpleStore";
import {Store} from "./Store";
import {createAsyncPromise} from "./test-utils";


describe("Mutators - sanity tests", function () {

    beforeEach(function () {
        enableTyduxDevelopmentMode();
    });

    it("can not change the state deeply", function () {
        class TestMutator extends Mutators<{ n1: number[] }> {
            mod1() {
                this.state.n1.push(3);
            }
        }

        const store = createSimpleStore("", new TestMutator(), {n1: [1, 2]});
        assert.throws(() => store.mod1());
    });

    it("can not change the state asynchronously", function (done) {
        class TestMutator extends Mutators<{ n1: number }> {
            mut() {
                setTimeout(() => {
                    assert.throws(() => this.state, /Illegal access.*this/);
                    done();
                }, 0);
            }
        }

        class MyStore extends Store<TestMutator, { n1: number }> {
            action() {
                this.mutate.mut();
            }
        }

        const store = new MyStore("", new TestMutator(), {n1: 0});
        store.action();
    });

    it("can not change the state in asynchronous promise callbacks", function (done) {
        class TestMutator extends Mutators<{ n1: number }> {
            mod1() {
                createAsyncPromise(1).then(val => {
                    assert.throws(() => this.state.n1 = val);
                    done();
                });
            }
        }

        const store = createSimpleStore("", new TestMutator(), {n1: 0});
        store.mod1();
    });

    it("can not access other members asynchronously", function (done) {
        class TestMutator extends Mutators<{ n1: number }> {
            mod1() {
                setTimeout(() => {
                    assert.throws(() => this.mod2(), /Illegal access.*this/);
                    done();
                }, 0);
            }

            mod2() {
                // empty
            }
        }

        const store = createSimpleStore("", new TestMutator(), {n1: 0});
        store.mod1();
    });

    it("can not access other members in an asynchronous promise resolve", function (done) {
        class TestMutator extends Mutators<{ n1: number }> {
            mod1() {
                createAsyncPromise(1)
                        .then(() => {
                            this.mod2();
                        })
                        .catch((e) => {
                            assert.match(e, /Illegal access.*this/);
                            done();
                        });
            }

            mod2() {
                // empty
            }
        }

        const store = createSimpleStore("", new TestMutator(), {n1: 0});
        store.mod1();
    });

});
