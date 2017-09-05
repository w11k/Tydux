import {createStore, Mutators} from "./Store";
import {createAsyncPromise} from "./test-utils";
import {enableDevelopmentMode} from "./development";


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

        const store = createStore("", new TestMutator(), {n1: [1, 2]});
        assert.throws(() => store.dispatch.mod1());
    });

    it("methods can not change the state asynchronously", function (done) {
        class TestMutator extends Mutators<{ n1: number }> {
            mod1() {
                setTimeout(() => {
                    assert.throws(() => this.state);
                    done();
                }, 0);
            }
        }

        const store = createStore("", new TestMutator(), {n1: 0});
        store.dispatch.mod1();
    });

    it("methods can not change the state in promise callbacks", function (done) {
        class TestMutator extends Mutators<{ n1: number }> {
            mod1() {
                createAsyncPromise(1).then(val => {
                    assert.throws(() => this.state.n1 = val);
                    done();
                });
            }
        }

        const store = createStore("", new TestMutator(), {n1: 0});
        store.dispatch.mod1();
    });

    it("methods can not return a value", function () {
        class TestMutator extends Mutators<any> {
            // noinspection JSMethodCanBeStatic
            errorWrongType() {
                return 1;
            }
        }

        const store = createStore("", new TestMutator(), {});
        assert.throws(() => store.dispatch.errorWrongType());
    });

    it("methods can not return a Promise other than Promise<void>", function (done) {
        class TestMutator extends Mutators<any> {
            // noinspection JSMethodCanBeStatic
            errorWrongPromiseType() {
                return createAsyncPromise(1).then(val => val);
            }
        }

        const store = createStore("", new TestMutator(), {});
        store.dispatch.errorWrongPromiseType()
            .catch(() => {
                done();
            });
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

        const store = createStore("", new TestMutator(), {a: 0});
        assert.throws(() => store.dispatch.mut1());
        assert.equal(store.state.a, 0);
    });

});
