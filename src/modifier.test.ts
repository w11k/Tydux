import {enableDevelopmentMode} from "./devTools";
import {createStore, Mutators} from "./Store";
import {createAsyncPromise} from "./test-utils";


describe("Mutators", function () {

    beforeEach(function () {
        enableDevelopmentMode();
    });

    it("methods can change the state", function () {
        class TestMutator extends Mutators<{ n1: number }> {
            mod1() {
                this.state.n1 = 1;
            }
        }

        const store = createStore("", new TestMutator(), {n1: 0});
        store.dispatch.mod1();
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

        const store = createStore("", new TestMutator(), {n1: 0});
        store.dispatch.mod1();
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

        const store = createStore("", new TestMutator(), {n1: ""});
        store.dispatch.mod1();
        assert.deepEqual(store.state, {n1: "123"});
    });

    it("nested async methods are merged", function (done) {
        class TestMutator extends Mutators<{ n1: string }> {
            async mod1() {
                this.state.n1 += "1";
                this.mod2();
                await this.mod3();
            }

            mod2() {
                this.state.n1 += "2";
            }

            async mod3() {
                this.state.n1 += "3";
                const val = await createAsyncPromise(this.state.n1);
                assert.equal(val, "123");
                done();
            }
        }

        const store = createStore("", new TestMutator(), {n1: ""});
        store.dispatch.mod1();
    });

    it("methods can use promises with nested mutators as callback", function (done) {
        class TestMutator extends Mutators<{ n1: number }> {
            mod1() {
                createAsyncPromise(1).then(val => {
                    this.assignN1(val);
                    this.validateN1();
                    done();
                });
            }

            assignN1(n1: number) {
                this.state.n1 = n1;
            }

            validateN1() {
                assert.equal(this.state.n1, 1);
            }
        }

        const store = createStore("", new TestMutator(), {n1: 0});
        store.dispatch.mod1();
    });

    it("methods can be async with nested mutators as callback", function (done) {
        class TestMutator extends Mutators<{ n1: number }> {
            async mod1() {
                const val = await createAsyncPromise(1);
                this.assignN1(val);
                this.validateN1();
                done();
            }

            assignN1(n1: number) {
                this.state.n1 = n1;
            }

            validateN1() {
                assert.equal(this.state.n1, 1);
            }
        }

        const store = createStore("", new TestMutator(), {n1: 0});
        store.dispatch.mod1();
    });


});
