import {enableDevelopmentMode} from "./devTools";
import {createStore, Modifiers} from "./Store";
import {createAsyncPromise} from "./test-utils";


describe("Modifiers - sanity tests", function () {

    beforeEach(function () {
        enableDevelopmentMode();
    });

    it("methods can not change the state asynchronously", function (done) {
        class TestModifier extends Modifiers<{ n1: number }> {
            mod1() {
                setTimeout(() => {
                    assert.throws(() => this.state);
                    done();
                }, 0);
            }
        }

        const store = createStore("", new TestModifier(), {n1: 0});
        store.dispatch.mod1();
    });

    it("methods can not change the state in promise callbacks", function (done) {
        class TestModifier extends Modifiers<{ n1: number }> {
            mod1() {
                createAsyncPromise(1).then(val => {
                    assert.throws(() => this.state.n1 = val);
                    done();
                });
            }
        }

        const store = createStore("", new TestModifier(), {n1: 0});
        store.dispatch.mod1();
    });

    it("methods can not return a value", function () {
        class TestModifier extends Modifiers<any> {
            // noinspection JSMethodCanBeStatic
            errorWrongType() {
                return 1;
            }
        }

        const store = createStore("", new TestModifier(), {});
        assert.throws(() => store.dispatch.errorWrongType());
    });

    it("methods can not return a Promise other than Promise<void>", function (done) {
        class TestModifier extends Modifiers<any> {
            // noinspection JSMethodCanBeStatic
            errorWrongPromiseType() {
                return createAsyncPromise(1).then(val => val);
            }
        }

        const store = createStore("", new TestModifier(), {});
        store.dispatch.errorWrongPromiseType()
            .catch(() => {
                done();
            });
    });

});
