import {enableDevelopmentMode} from "./development";
import {createStore, Mutators, Store} from "./Store";
import "rxjs/add/operator/take";


describe("Modifier hooks", function () {

    beforeEach(function () {
        enableDevelopmentMode();
    });

    it("before hook", function (done) {
        class TestMutator extends Mutators<{ n1: number }> {
            mutator() {
                this.state.n1++;
            }
        }

        const store = createStore("", new TestMutator(), {n1: 0});
        store.hooks.mutator.before.take(1).subscribe(done);
        store.dispatch.mutator();
    });

    it("after hook", function (done) {
        class TestMutator extends Mutators<{ n1: number }> {
            mutator() {
                this.state.n1++;
            }
        }

        const store = createStore("", new TestMutator(), {n1: 0});
        store.hooks.mutator.after.take(1).subscribe(done);
        store.dispatch.mutator();
    });

    it("after hook with asynchronous mutator", function (done) {
        class TestMutator extends Mutators<{ n1: number }> {
            mutator() {
                return new Promise<void>(resolve => {
                    setTimeout(() => {
                        resolve();
                    }, 1);
                });
            }
        }

        const store = createStore("", new TestMutator(), {n1: 0});
        let hookCalled = false;
        store.hooks.mutator.after.take(1).subscribe(() => {
            hookCalled = true;
        });
        store.dispatch.mutator().then(() => {
            assert.isTrue(hookCalled);
            done();
        });
    });

    it("documentation", () => {
        class MyState {
            count = 0;
        }

        class MyMutators extends Mutators<MyState> {
            increment() {
                this.state.count++;
            }
        }

        class MyStore extends Store<MyMutators, MyState> {
            constructor() {
                super("myStore", new MyMutators(), new MyState());
            }
        }

        const store = new MyStore();

        store.hooks.increment.before.subscribe(() => {
            console.log("before", store.state.count);
        });
        store.hooks.increment.after.subscribe(() => {
            console.log("after", store.state.count);
        });

        store.dispatch.increment();
    });

});
