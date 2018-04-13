/*
import {assert} from "chai";
import {enableTyduxDevelopmentMode} from "./development";
import {resetTydux} from "./global-state";
import {Mutators} from "./mutators";
import {Store} from "./Store";
import {createAsyncPromise} from "./test-utils";


describe("Mutators - sanity tests", function () {

    beforeEach(() => enableTyduxDevelopmentMode());

    afterEach(() => resetTydux());

    it("can not access the state asynchronously", function (done) {
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

    it("can not modify the state asynchronously by keeping a reference to a nested state property", function (done) {
        class TestMutator extends Mutators<{ root: { child: number[] } }> {
            mut() {
                const child = this.state.root.child;
                setTimeout(() => {
                    assert.throws(() => child.push(3), /not extensible/);
                    done();
                }, 0);
            }
        }

        class MyStore extends Store<TestMutator, { root: { child: number[] } }> {
            action() {
                this.mutate.mut();
            }
        }

        const state = {root: {child: [1, 2]}};
        const store = new MyStore("", new TestMutator(), state);
        store.action();
    });

    it("can not replace the state asynchronously", function (done) {
        class TestMutator extends Mutators<{ n1: number }> {
            mut() {
                setTimeout(() => {
                    assert.throws(() => this.state = {n1: 99}, /Illegal access.*this/);
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
            mut1() {
                createAsyncPromise(1).then(val => {
                    assert.throws(() => this.state.n1 = val);
                    done();
                });
            }
        }

        class MyStore extends Store<TestMutator, { n1: number }> {
            action() {
                this.mutate.mut1();
            }
        }

        const store = new MyStore("", new TestMutator(), {n1: 0});
        store.action();
    });

    it("can not access other members asynchronously", function (done) {
        class TestMutator extends Mutators<{ n1: number }> {
            mut1() {
                setTimeout(() => {
                    assert.throws(() => this.mut2(), /Illegal access.*this/);
                    done();
                }, 0);
            }

            mut2() {
                // empty
            }
        }

        class MyStore extends Store<TestMutator, { n1: number }> {
            action() {
                this.mutate.mut1();
            }
        }

        const store = new MyStore("", new TestMutator(), {n1: 0});
        store.action();
    });

    it("can not access other members in an asynchronous promise resolve", function (done) {
        class TestMutator extends Mutators<{ n1: number }> {
            mut1() {
                createAsyncPromise(1)
                    .then(() => {
                        this.mut2();
                    })
                    .catch((e) => {
                        assert.match(e, /Illegal access.*this/);
                        done();
                    });
            }

            mut2() {
                // empty
            }
        }

        class MyStore extends Store<TestMutator, { n1: number }> {
            action() {
                this.mutate.mut1();
            }
        }

        const store = new MyStore("", new TestMutator(), {n1: 0});
        store.action();
    });

    it("must not return a value", function () {
        class TestMutator extends Mutators<any> {
            mod1() {
                return 1;
            }
        }

        class MyStore extends Store<TestMutator, any> {
            action() {
                assert.throws(() => this.mutate.mod1());
            }
        }

        const store = new MyStore("", new TestMutator(), {});
        store.action();
    });

});
*/
