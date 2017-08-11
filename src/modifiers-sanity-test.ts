import {enableDevelopmentMode} from "./devTools";
import {createStore, Mutators} from "./Store";
import {createAsyncPromise} from "./test-utils";


describe("Mutators - sanity tests", function () {

    beforeEach(function () {
        enableDevelopmentMode();
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

});
