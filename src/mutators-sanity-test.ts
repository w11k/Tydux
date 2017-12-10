import { Mutators} from "./Store";
import {createAsyncPromise} from "./test-utils";
import {enableDevelopmentMode} from "./development";
import {createSimpleStore} from "./SimpleStore";


describe("Mutators - sanity tests", function () {

    beforeEach(function () {
        enableDevelopmentMode();
    });

    it("methods can not change the state deeply", function () {
        class TestMutator extends Mutators<{ n1: number[] }> {
            mod1() {
                this.state.n1.push(3);
            }
        }

        const store = createSimpleStore("", new TestMutator(), {n1: [1, 2]});
        assert.throws(() => store.mutate.mod1());
    });

    it("methods can not change the state asynchronously", function (done) {
        class TestMutator extends Mutators<{ n1: number }> {
            mod1() {
                setTimeout(() => {
                    assert.throws(() => this.state, /Illegal access.*this/);
                    done();
                }, 0);
            }
        }

        const store = createSimpleStore("", new TestMutator(), {n1: 0});
        store.mutate.mod1();
    });

    it("methods can not change the state in asynchronous promise callbacks", function (done) {
        class TestMutator extends Mutators<{ n1: number }> {
            mod1() {
                createAsyncPromise(1).then(val => {
                    assert.throws(() => this.state.n1 = val);
                    done();
                });
            }
        }

        const store = createSimpleStore("", new TestMutator(), {n1: 0});
        store.mutate.mod1();
    });

    it("methods can not return a value", function () {
        class TestMutator extends Mutators<any> {
            // noinspection JSMethodCanBeStatic
            errorWrongType() {
                return 1;
            }
        }

        const store = createSimpleStore("", new TestMutator(), {});
        assert.throws(() => store.mutate.errorWrongType());
    });

    it("methods can not access other members asynchronously", function (done) {
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
        store.mutate.mod1();
    });

    it("methods can not access other members in an asynchronous promise resolve", function (done) {
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
        store.mutate.mod1();
    });

});
