import {assert} from "chai";
import {Action, createStore, Store, Store as ReduxStore} from "redux";
import {Commands} from "./commands";
import {Fassade} from "./Fassade";
import {createTyduxStore, TyduxStoreBridge} from "./store";


describe("Store", function () {

    it("createTyduxStore() - fassade at root", async function () {
        const initialState = {
            val: 10
        };

        class MyCommands extends Commands<typeof initialState> {
            inc(by: number) {
                this.state.val += by;
            }
        }

        class MyFassade extends Fassade<typeof initialState, MyCommands> {
            createCommands() {
                return new MyCommands();
            }

            action() {
                this.commands.inc(100);
            }
        }

        const tyduxStore = createTyduxStore(initialState);
        const mount = tyduxStore.createMountPoint(s => s, (state, fassade) => ({...fassade}));
        const myFassade = new MyFassade(mount);
        myFassade.action();

        assert.deepEqual(tyduxStore.getState(), {
            val: 110
        });
    });

    it("createTyduxStore() - with slice", async function () {
        const initialState = {
            fassade: {
                val: 10
            }
        };

        class MyCommands extends Commands<typeof initialState.fassade> {
            inc(by: number) {
                this.state.val += by;
            }
        }

        class MyFassade extends Fassade<typeof initialState.fassade, MyCommands> {
            createCommands() {
                return new MyCommands();
            }

            action() {
                this.commands.inc(100);
            }
        }

        const tyduxStore = createTyduxStore(initialState);
        const mount = tyduxStore.createMountPoint(s => s.fassade, (state, fassade) => ({...state, fassade}));
        const myFassade = new MyFassade(mount);
        myFassade.action();

        assert.deepEqual(tyduxStore.getState(), {
            fassade: {
                val: 110
            }
        });
    });

    it("createRootMountPoint()", async function () {
        const initialState = {
            managedByFassade: {
                val: 10
            }
        };

        type ManagedByFassadeState = typeof initialState.managedByFassade;

        const tyduxBridge = new TyduxStoreBridge();
        const reduxStore = createStore(tyduxBridge.createTyduxReducer(initialState));
        const connected = tyduxBridge.connectStore(reduxStore);
        const mount = connected.createRootMountPoint("managedByFassade");

        class MyCommands extends Commands<ManagedByFassadeState> {
            inc(by: number) {
                this.state.val += by;
            }
        }

        class MyFassade extends Fassade<ManagedByFassadeState, MyCommands> {

            getName() {
                return "MyFassade";
            }

            createCommands() {
                return new MyCommands();
            }

            action() {
                this.commands.inc(100);
            }
        }

        const myFassade = new MyFassade(mount);
        myFassade.action();

        assert.deepEqual(reduxStore.getState(), {
            managedByFassade: {
                val: 110
            }
        });
    });

    it("can be used along Redux reducer", async function () {
        const initialState = {
            someValue: 0,
            managedByFassade: {
                val: 10
            }
        };

        type AppState = typeof initialState;
        type ManagedByFassadeState = typeof initialState.managedByFassade;

        function plainReducer(state: AppState|undefined = initialState, action: any) {
            switch (action.type) {
                case "inc":
                    return {
                        ...state,
                        someValue: state.someValue + action.payload
                    };
            }
            return state;
        }

        const tyduxBridge = new TyduxStoreBridge();
        const reduxStore: ReduxStore<AppState, Action> = createStore(tyduxBridge.wrapReducer(plainReducer));
        const connected = tyduxBridge.connectStore(reduxStore);
        const mount = connected.createRootMountPoint("managedByFassade");

        reduxStore.dispatch({type: "inc", payload: 5});

        class MyCommands extends Commands<ManagedByFassadeState> {
            inc(by: number) {
                this.state.val += by;
            }
        }

        class MyFassade extends Fassade<ManagedByFassadeState, MyCommands> {

            getName() {
                return "MyFassade";
            }

            createCommands() {
                return new MyCommands();
            }

            action() {
                this.commands.inc(100);
            }
        }

        const myFassade = new MyFassade(mount);
        myFassade.action();

        assert.deepEqual(reduxStore.getState(), {
            someValue: 5,
            managedByFassade: {
                val: 110
            }
        });
    });

});
