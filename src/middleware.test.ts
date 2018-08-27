import {assert} from "chai";
import {enableTyduxDevelopmentMode} from "./development";
import {resetTydux} from "./global-state";
import {Middleware} from "./middleware";
import {Mutator, MutatorAction} from "./mutator";
import {ProcessedAction, Store} from "./Store";


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
        class MyMiddleware extends Middleware<TestState, Mutator<any>, TestStore> {
            getName(): string {
                return "";
            }
        }

        const store = new TestStore("TestStore", new TestMutator(), new TestState());
        const ms = store.installMiddleware(new MyMiddleware());

        assert.deepEqual(store.state, ms.state);
        store.action();
        assert.deepEqual(store.state, ms.state);
    });

    it("beforeActionDispatch", function (done) {
        class MyMiddleware extends Middleware<TestState, Mutator<any>, TestStore> {
            getName(): string {
                return "";
            }

            beforeActionDispatch(state: TestState, action: MutatorAction): any {
                done();
            }
        }

        const store = new TestStore("TestStore", new TestMutator(), new TestState());
        store.installMiddleware(new MyMiddleware());
        store.action();
    });

    it("afterActionProcessed", function (done) {
        class MyMiddleware extends Middleware<TestState, Mutator<any>, TestStore> {
            getName(): string {
                return "";
            }

            afterActionProcessed(processedAction: ProcessedAction<TestState>): void {
                done();
            }
        }

        const store = new TestStore("TestStore", new TestMutator(), new TestState());
        store.installMiddleware(new MyMiddleware());
        store.action();
    });


});
