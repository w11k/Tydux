import {assert} from "chai";
import {enableTyduxDevelopmentMode} from "./development";
import {resetTydux} from "./global-state";
import {Middleware} from "./middleware";
import {Mutator} from "./mutator";
import {Store} from "./Store";


class TestState {
    n1 = 0;
}

class TestMutator extends Mutator<TestState> {
    addToN1(val: number) {
        this.state.n1 += val;
    }
}

class TestStore extends Store<TestMutator, TestState> {
    action() {
        this.mutate.addToN1(1);
    }
}

describe("Middleware", function () {

    beforeEach(() => enableTyduxDevelopmentMode());

    afterEach(() => resetTydux());

    it("has the same state as the store", function () {

        class MyMiddlewareMutator extends Mutator<TestState> {
            // setN1To100() {
            //     this.state.n1 = 100;
            // }
        }

        class MyMiddleware extends Middleware<TestState, MyMiddlewareMutator, TestStore> {
            getName(): string {
                return "";
            }
            // beforeActionDispatch(state: TestState, action: Action): any {
            //     console.log("beforeActionDispatch", state, action);
            // }
            //
            // afterActionProcessed(processedAction: ProcessedAction<TestState>): void {
            //     console.log("afterActionProcessed", processedAction);
            // }
        }

        const store = new TestStore("TestStore", new TestMutator(), new TestState());
        const ms = store.installMiddleware(init => {
            return new MyMiddleware(init, new MyMiddlewareMutator());
        });

        assert.deepEqual(store.state, ms.state);
        store.action();
        assert.deepEqual(store.state, ms.state);
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
