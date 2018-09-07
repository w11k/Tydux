import {createStore, Store as ReduxStore} from "redux";
import {enableTyduxDevelopmentMode} from "./development";
import {resetTydux} from "./global-state";
import {Mutator} from "./mutator";
import {createMountPoint, Store, tyduxReducer} from "./Store";


describe("Redux", function () {

    beforeEach(() => enableTyduxDevelopmentMode());

    afterEach(() => resetTydux());

    it("integration", async function () {

        const initialState = {
            a: 0,
            tydux: {
                b: 10
            }
        };

        function todoApp(state = initialState, action: { type: string, payload: any }) {
            console.log("action", action);
            state = tyduxReducer(state, action);
            switch (action.type) {
                case "inc":
                    return Object.assign({}, state, {
                        a: state.a + action.payload
                    });
                default:
                    return state;
            }
        }

        let reduxStore: ReduxStore<typeof initialState, { type: string, payload: any }> = createStore(todoApp);
        reduxStore.dispatch({type: "inc", payload: 10});

        type TyduxState = typeof initialState.tydux;

        const mount = createMountPoint(
            reduxStore,
            s => s.tydux,
            (s, l) => ({...s, tydux: l})
        );

        class MyMutator extends Mutator<TyduxState> {
            inc(by: number) {
                this.state.b += by;
            }
        }

        class MyStore extends Store<TyduxState, MyMutator> {

            getName() {
                return "MyStore";
            }

            createMutator() {
                return new MyMutator();
            }

            action() {
                this.mutate.inc(100);
            }
        }

        const tyduxStore = new MyStore(mount);

        tyduxStore.action();
        console.log("reduxStore.getState()", reduxStore.getState());

        console.log("-------------\n");
    });

});
