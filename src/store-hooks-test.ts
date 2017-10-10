import {enableDevelopmentMode} from "./development";
import {createStore, Mutators} from "./Store";
import "rxjs/add/operator/take";


describe("Store hooks", function () {

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

});
