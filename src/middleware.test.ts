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

class TestStore extends Store<TestMutator, TestState> {
    action() {
        this.mutate.mut1();
    }
}

class SubTestStore extends TestStore {
}

////////////////////////////
const store = new TestStore("", new TestMutator(), new TestState());


const m1: MiddlewareInit<TestStore, TestState> = (store, state) => {
    return {
        beforeActionDispatch(state, action) {
        },
        afterActionProcessed(processedAction) {
        }
    };
};

store.addMiddleware(m1);


////////////////////////////


describe("Middleware", function () {

    beforeEach(() => enableTyduxDevelopmentMode());

    afterEach(() => resetTydux());

    it("can set the state manually", function () {

        // const myMiddleware: MiddlewareInit<TestStore, TestState> = (store) => {
        //     return {
        //         beforeActionDispatch(state, action) {
        //         },
        //         afterProcessedAction(processedAction) {
        //         }
        //     };
        // };
        //
        // const store = new TestStore(
        //     "TestStore",
        //     new TestMutator(),
        //     new TestState(),
        // );
        //
        // store.action();
        //
        // assert.deepEqual(store.state, {n1: 1});

    });

});
