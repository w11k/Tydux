import {enableDevelopmentMode} from "./development";
import {createSimpleStore} from "./SimpleStore";
import {Mutators} from "./Store";
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

    it("modifier can return a promise", function (done) {
        class TestMutator extends Mutators<{ n1: string }> {
            async mod1(): Promise<void> {
                return await createAsyncPromise(this.state.n1).then(() => {
                    // return void
                });
            }
        }

        const store = createSimpleStore("", new TestMutator(), {n1: ""});
        store.mutate.mod1().then(() => {
            done();
        });
    });

    it("exceptions in promise handler of async mutators are not caught", function (done) {
        class TestMutator extends Mutators<{ n1: string }> {
            async mod1(): Promise<void> {
                return await createAsyncPromise(this.state.n1).then(() => {
                    throw new Error("");
                });
            }
        }

        const store = createSimpleStore("", new TestMutator(), {n1: ""});
        store.mutate.mod1().then(
                () => {
                }, () => {
                    done();
                });
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

        const store = createSimpleStore("", new TestMutator(), {n1: ""});
        store.mutate.mod1();
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

        const store = createSimpleStore("", new TestMutator(), {n1: 0});
        store.mutate.mod1();
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

        const store = createSimpleStore("", new TestMutator(), {n1: 0});
        store.mutate.mod1();
    });


});
