import {Action, AnyAction, createStore, Store as ReduxStore} from "redux";
import {Commands} from "./commands";
import {Facade} from "./Facade";
import {createTyduxStore, TyduxReducerBridge} from "./store";
import {untilNoBufferedStateChanges} from "./utils";


describe("Store", function () {

    it("createTyduxStore() - facade at root", async function () {
        const initialState = {
            val: 10
        };

        class MyCommands extends Commands<typeof initialState> {
            inc(by: number) {
                this.state.val += by;
            }
        }

        class MyFacade extends Facade<MyCommands> {
            action() {
                this.commands.inc(100);
            }
        }

        const tyduxStore = createTyduxStore();
        const myFacade = new MyFacade(tyduxStore.createMountPoint("foo"), new MyCommands(), initialState);
        myFacade.action();

        expect(tyduxStore.getState()).toEqual({
            foo: {
                val: 110
            }
        });
    });

    it("createTyduxStore() - facade with deep slice", async function () {
        const initialState = {
            val: 1
        };

        class MyCommands extends Commands<typeof initialState> {
            inc(by: number) {
                this.state.val += by;
            }
        }

        class MyFacade extends Facade<MyCommands> {
            action() {
                this.commands.inc(100);
            }
        }

        const tyduxStore = createTyduxStore({foo: {bar: {}}});
        const myFacade = new MyFacade(tyduxStore.createDeepMountPoint("foo.bar.baz"), new MyCommands(), initialState);

        expect(tyduxStore.getState()).toEqual({
            foo: {
                bar: {
                    baz: {
                        val: 1
                    }
                }
            }
        });

        myFacade.action();

        expect(tyduxStore.getState()).toEqual({
            foo: {
                bar: {
                    baz: {
                        val: 101
                    }
                }
            }
        });
    });

    it("select() emits value on state changes", async function () {
        const initialState = {
            val: 10
        };

        class MyCommands extends Commands<typeof initialState> {
            inc(by: number) {
                this.state.val += by;
            }
        }

        class MyFacade extends Facade<MyCommands> {
            action() {
                this.commands.inc(100);
            }
        }

        const tyduxStore = createTyduxStore();
        const collected: any[] = [];
        tyduxStore.select().subscribe(state => {
            collected.push(state.myFacade);
        });

        const myFacade = new MyFacade(tyduxStore.createMountPoint("myFacade"), new MyCommands(), initialState);
        myFacade.action();

        await untilNoBufferedStateChanges(myFacade);
        expect(collected).toEqual([undefined, {val: 110}, {val: 110}]);
    });

    it("createTyduxStore() with plain reducer in config", async function () {
        const initialState = {
            someValue: 0,
            managedByFacade: {
                val: 10
            }
        };

        type AppState = typeof initialState;
        type ManagedByFacadeState = typeof initialState.managedByFacade;

        function plainReducer(state: AppState | undefined = initialState, action: any) {
            switch (action.type) {
                case "inc":
                    return {
                        ...state,
                        someValue: state.someValue + action.payload
                    };
            }
            return state;
        }

        const store = createTyduxStore(initialState, {reducer: plainReducer});
        store.store.dispatch({type: "inc", payload: 5});

        class MyCommands extends Commands<ManagedByFacadeState> {
            inc(by: number) {
                this.state.val += by;
            }
        }

        class MyFacade extends Facade<MyCommands> {
            action() {
                this.commands.inc(100);
            }
        }

        const mount = store.createMountPoint("managedByFacade");
        const myFacade = new MyFacade(mount, new MyCommands(), undefined);
        myFacade.action();

        expect(store.store.getState()).toEqual({
            someValue: 5,
            managedByFacade: {
                val: 110
            }
        });
    });

    it("TyduxBridge#wrapReducer(plainReducer)", async function () {
        const initialState = {
            someValue: 0,
            managedByFacade: {
                val: 10
            }
        };

        type AppState = typeof initialState;
        type ManagedByFacadeState = typeof initialState.managedByFacade;

        function plainReducer(state: AppState | undefined = initialState, action: any) {
            switch (action.type) {
                case "inc":
                    return {
                        ...state,
                        someValue: state.someValue + action.payload
                    };
            }
            return state;
        }

        const tyduxBridge = new TyduxReducerBridge();
        const reduxStore: ReduxStore<AppState, Action> = createStore(tyduxBridge.wrapReducer(plainReducer));
        const connected = tyduxBridge.connectStore(reduxStore);
        const mount = connected.createMountPoint("managedByFacade");

        reduxStore.dispatch({type: "inc", payload: 5});

        class MyCommands extends Commands<ManagedByFacadeState> {
            inc(by: number) {
                this.state.val += by;
            }
        }

        class MyFacade extends Facade<MyCommands> {
            action() {
                this.commands.inc(100);
            }
        }

        const myFacade = new MyFacade(mount, new MyCommands(), undefined);
        myFacade.action();

        expect(reduxStore.getState()).toEqual({
            someValue: 5,
            managedByFacade: {
                val: 110
            }
        });
    });

    it("can be used along Redux with Tydux reducer", async function () {
        const initialState = {
            someValue: 0,
            managedByFacade: {
                val: 10
            }
        };

        type AppState = typeof initialState;
        type ManagedByFacadeState = typeof initialState.managedByFacade;

        const tyduxBridge = new TyduxReducerBridge();
        const tyduxReducer = tyduxBridge.createTyduxReducer();

        function rootReducer(state: AppState | undefined = initialState, action: AnyAction) {
            switch (action.type) {
                case "inc":
                    return {
                        ...state,
                        someValue: state.someValue + action.payload
                    };
            }
            return tyduxReducer(state, action);
        }


        const reduxStore: ReduxStore<AppState, Action> = createStore(rootReducer);
        const connected = tyduxBridge.connectStore(reduxStore);
        const mount = connected.createMountPoint("managedByFacade");

        reduxStore.dispatch({type: "inc", payload: 5});

        class MyCommands extends Commands<ManagedByFacadeState> {
            inc(by: number) {
                this.state.val += by;
            }
        }

        class MyFacade extends Facade<MyCommands> {
            action() {
                this.commands.inc(100);
            }
        }

        const myFacade = new MyFacade(mount, new MyCommands(), undefined);
        myFacade.action();

        expect(reduxStore.getState()).toEqual({
            someValue: 5,
            managedByFacade: {
                val: 110
            }
        });
    });

});
