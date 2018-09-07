import {assert} from "chai";
import {enableTyduxDevelopmentMode} from "./development";
import {resetTydux} from "./global-state";
import {Mutator} from "./mutator";
import {EmptyMutators} from "./mutator.test";
import {Store} from "./Store";
import {afterAllStoreEvents, collect, createAsyncPromise} from "./test-utils";


describe("Store - sanity tests", function () {

    beforeEach(() => enableTyduxDevelopmentMode());

    afterEach(() => resetTydux());

    it("can not modify the state directly", function () {
        class MyStore extends Store<any, any> {

            action() {
                (this.state as any).count = 1;
            }

        }

        const store = new MyStore("myStore", new EmptyMutators(), {});
        assert.throws(() => store.action());
    });

    it("can not assign the state", function () {
        class MyStore extends Store<any, any> {

            action() {
                (this.state as any) = {};
            }

        }

        const store = new MyStore("myStore", new EmptyMutators(), {});
        assert.throws(() => store.action());
    });

    it("member method can use async/await", async function () {
        class MyState {
            count = 0;
        }

        class MyMutators extends Mutator<MyState> {
            incrementBy(by: number) {
                this.state.count += by;
            }
        }

        class MyStore extends Store<MyMutators, MyState> {
            async action() {
                this.mutate.incrementBy(1);
                const by = await createAsyncPromise(10);
                this.mutate.incrementBy(by);

                await afterAllStoreEvents(store);

                collected.assert(0, 1, 11);
            }
        }

        const store = new MyStore("myStore", new MyMutators(), new MyState());
        let collected = collect(store.select(s => s.count).unbounded());
        store.action();
    });

    it("member method can use member variables", function () {
        class MyStore extends Store<any, any> {

            counterA?: number;

            counterB = 1;

            action() {
                this.counterA = 10;
                this.innerAction();
            }

            private innerAction() {
                this.counterB = 20;
            }
        }

        const store = new MyStore("myStore", new EmptyMutators(), {});
        store.action();
        assert.equal(store.counterA, 10);
        assert.equal(store.counterB, 20);
    });

    it("member method can use async/await and instance variables", function (done) {
        class MyStore extends Store<any, any> {

            counter = 0;

            async action() {
                this.counter = 10;
                await createAsyncPromise(10);
                this.counter++;

                setTimeout(() => {
                    assert.equal(this.counter, 11);
                    done();
                }, 0);

            }
        }

        const store = new MyStore("myStore", new EmptyMutators(), {});
        store.action();
    });

    it("member methods and invoked sibling methods access the same instance variables", function () {
        class MyStore extends Store<any, any> {

            counter = 0;

            action() {
                this.counter = 10;
                this.check();
            }

            private check() {
                assert.equal(this.counter, 10);
            }
        }

        const store = new MyStore("myStore", new EmptyMutators(), {});
        store.action();
    });

    it("member method can use async/await and call sibling methods", function (done) {
        class MyStore extends Store<any, any> {

            chars = "A";

            async action() {
                this.chars += "B";
                this.append();
                await createAsyncPromise(10);
                this.chars += "C";
                this.append();
                this.chars += "E";

                setTimeout(() => {
                    assert.equal(this.chars, "ABXCXE");
                    done();
                }, 0);
            }

            private append() {
                this.chars += "X";
            }
        }

        const store = new MyStore("myStore", new EmptyMutators(), {});
        store.action();
    });

    it("exception in action method does not revert changes to instance variables", function () {
        class MyStore extends Store<any, any> {

            chars = "";

            action() {
                this.chars = "A";
                throw new Error();
            }

        }

        const store = new MyStore("myStore", new EmptyMutators(), {});

        try {
            store.action();
        } catch (e) {
            // ignore
        }
        assert.equal(store.chars, "A");
    });

    it("(compiler checks)", function () {
        class MyState {
            s1 = 1;
        }

        class MyMutator extends Mutator<MyState> {
            // invalid = 2;

            met1(): number {
                this.state.s1++;
                return 1;
            }
        }

        class MyStore extends Store<MyMutator, MyState> {
            action1() {
                // const x: number = this.mutate.met1();
                // console.log(this.mutate.invalid + 1);
            }
        }

        const store = new MyStore("myStore", new MyMutator(), new MyState());

        store.action1();
    });

});
