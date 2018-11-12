/*
import {assert} from "chai";
import {enableTyduxDevelopmentMode} from "./development";
import {resetTydux} from "./global-state";
import {Middleware} from "./middleware";
import {Commands, MutatorAction} from "./commands";
import {ProcessedAction, Facade} from "./Facade";


class TestState {
    n1 = 0;
}

class TestMutator extends Commands<TestState> {
    addToN1(val: number) {
        this.state.n1 += val;
    }
}

class TestStore extends Facade<TestMutator, TestState> {
    action(val: number) {
        this.commands.addToN1(val);
    }
}

describe("Middleware", function () {

    beforeEach(() => enableTyduxDevelopmentMode());

    afterEach(() => resetTydux());

    it("has the same state as the store", function () {
        class MyMiddleware extends Middleware<TestState, Commands<any>, TestStore> {
            getName(): string {
                return "TestMiddleware";
            }
        }

        const store = new TestStore("TestStore", new TestMutator(), new TestState());
        const ms = store.installMiddleware(new MyMiddleware());

        assert.deepEqual(store.getState, ms.state);
        store.action(1);
        assert.deepEqual(store.getState, ms.state);
    });

    it("beforeActionDispatch", function (done) {
        class MyMiddleware extends Middleware<TestState, Commands<any>, TestStore> {
            getName(): string {
                return "TestMiddleware";
            }

            beforeActionDispatch(state: TestState, action: MutatorAction): any {
                assert.deepEqual(action.payload, [1]);
                done();
            }
        }

        const store = new TestStore("TestStore", new TestMutator(), new TestState());
        store.installMiddleware(new MyMiddleware());
        store.action(1);
    });

    it("afterActionProcessed", function (done) {
        class MyMiddleware extends Middleware<TestState, Commands<any>, TestStore> {
            getName(): string {
                return "TestMiddleware";
            }

            afterActionProcessed(processedAction: ProcessedAction<TestState>): void {
                assert.deepEqual(processedAction.mutatorAction.payload, [1]);
                done();
            }
        }

        const store = new TestStore("TestStore", new TestMutator(), new TestState());
        store.installMiddleware(new MyMiddleware());
        store.action(1);
    });

    it("can dispatch actions", function () {
        class MyMiddleware extends Middleware<TestState, Commands<any>, TestStore> {

            getName(): string {
                return "TestMiddleware";
            }

            dispatch() {
                this.mutatorDispatcher({type: "addToN1", payload: [9]});
            }
        }

        const store = new TestStore("TestStore", new TestMutator(), new TestState());
        let myMiddleware = new MyMiddleware();
        store.installMiddleware(myMiddleware);
        store.action(2);
        myMiddleware.dispatch();
        assert.deepEqual(store.getState, {n1: 11});
    });

});
*/
