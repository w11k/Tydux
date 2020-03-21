import {createStore} from "redux";
import {Commands} from "./commands";
import {Facade} from "./Facade";
import {createTyduxStore, TyduxReducerBridge} from "./store";
import {setGlobalStore} from "./store-global";

describe("global store", () => {

    afterEach(() => {
        setGlobalStore(undefined);
    });

    it("only one global store is allowed", () => {
        const s1 = createTyduxStore();
        setGlobalStore(s1);
        const s2 = createTyduxStore();
        expect(() => setGlobalStore(s2)).toThrow("already defined");
    });

    it("Facades use the global store when called only with the mount point", async () => {

        class TestState {
            foo = 1;
        }

        class TestCommands extends Commands<TestState> {
        }

        class TestFacade extends Facade<TestState, TestCommands> {
        }

        const tyduxBridge = new TyduxReducerBridge();
        const reduxStore = createStore(tyduxBridge.createTyduxReducer(), {});
        const tyduxStore = tyduxBridge.connectStore(reduxStore);
        setGlobalStore(tyduxStore);

        const facade = new TestFacade("test", new TestState(), new TestCommands());

        expect(reduxStore.getState()).toEqual({
            test: {
                foo: 1
            }
        });

        expect(facade.state).toEqual({
            foo: 1
        });
    });

});
