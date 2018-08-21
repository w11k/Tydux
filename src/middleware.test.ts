import {enableTyduxDevelopmentMode} from "./development";
import {resetTydux} from "./global-state";
import {Middleware, MiddlewareMutator} from "./middleware";
import {Mutator} from "./mutator";
import {Store} from "./Store";


class TestState {
    n1 = 0;
}

class TestMutator extends Mutator<TestState> {
    assignN1(val: number) {
        this.state.n1 = val;
    }
}

class TestStore extends Store<TestMutator, TestState> {
    action() {
        this.mutate.assignN1(1);
    }
}

describe("Middleware", function () {

    beforeEach(() => enableTyduxDevelopmentMode());

    afterEach(() => resetTydux());

    it("gets called immediately and receives the current state", function (done) {

        class MyMiddlewareMutator extends MiddlewareMutator<TestState> {
        }

        class MyMiddleware extends Middleware<TestState, Store<any, TestState>, MyMiddlewareMutator> {
        }

        const store = new TestStore("TestStore", new TestMutator(), new TestState());
        store.addMiddleware(new MyMiddleware(store, new MyMiddlewareMutator()));
    });

    // it("gets called before action dispatch", function (done) {
    //     const myMiddleware: MiddlewareInit<TestStore, TestState> = () => {
    //         return {
    //             beforeActionDispatch(state) {
    //                 assert.deepEqual(state, new TestState());
    //                 done();
    //             },
    //             afterActionProcessed() {
    //             }
    //         };
    //     };
    //
    //     const store = new TestStore("TestStore", new TestMutator(), new TestState());
    //     store.addMiddleware(myMiddleware);
    //     store.action();
    // });

    // it("can alter the event", function () {
    //     const myMiddleware: MiddlewareInit<TestStore, TestState> = () => {
    //         return {
    //             beforeActionDispatch(state, action) {
    //                 return {
    //                     ...action,
    //                     arguments: [10]
    //                 };
    //             },
    //             afterActionProcessed() {
    //             }
    //         };
    //     };
    //
    //     const store = new TestStore("TestStore", new TestMutator(), new TestState());
    //     store.addMiddleware(myMiddleware);
    //     store.action();
    //     assert.equal(store.state.n1, 10);
    // });

    // it("gets called after an event was dispatched", function (done) {
    //     const myMiddleware: MiddlewareInit<TestStore, TestState> = () => {
    //         return {
    //             beforeActionDispatch() {
    //             },
    //             afterActionProcessed(processedAction) {
    //                 assert.equal(processedAction.state.n1, 1);
    //                 done();
    //             }
    //         };
    //     };
    //
    //     const store = new TestStore("TestStore", new TestMutator(), new TestState());
    //     store.addMiddleware(myMiddleware);
    //     store.action();
    // });

});
