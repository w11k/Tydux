import {assert} from "chai";
import {enableTyduxDevelopmentMode} from "./development";
import {resetTydux} from "./global-state";
import {MiddlewareInit} from "./middleware";
import {Mutator} from "./mutator";
import {Store} from "./Store";


class TestState {
    n1 = 0;
}

class TestMutator extends Mutator<TestState> {
    mut1() {
        this.state.n1 = 1;
    }
}

class TestStoreBase extends Store<TestMutator, TestState> {
    action() {
        this.mutate.mut1();
    }
}

describe("Middleware", function () {

    beforeEach(() => enableTyduxDevelopmentMode());

    afterEach(() => resetTydux());

    it("can set the state manually", function () {

        class TestStore extends TestStoreBase {

        }

        const myMiddleware: MiddlewareInit<TestStore, TestState> = (store: TestStore) => {
            return {
                beforeActionDispatch(state, action) {
                },
                afterProcessedAction(processedAction) {
                }
            };
        };


        const store = new TestStore(
            "TestStore",
            new TestMutator(),
            new TestState());

        store.action();

        assert.deepEqual(store.state, {n1: 1});

    });

});
