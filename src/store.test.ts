import {assert} from "chai";
import {Action, createStore, Store, Store as ReduxStore} from "redux";
import {Commands} from "./commands";
import {Facade} from "./Facade";
import {createTyduxStore, TyduxReducerBridge} from "./store";


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

        class MyFacade extends Facade<typeof initialState, MyCommands> {
            action() {
                this.commands.inc(100);
            }
        }

        const tyduxStore = createTyduxStore(initialState);
        const mount = tyduxStore.createMountPoint(s => s, (state, facade) => ({...facade}));
        const myFacade = new MyFacade(mount, "TestFacade", new MyCommands());
        myFacade.action();

        assert.deepEqual(tyduxStore.getState(), {
            val: 110
        });
    });

    it("select() first emits the current state", function (done) {
        const initialState = {
            val: 10
        };

        const tyduxStore = createTyduxStore(initialState);

        tyduxStore.select().subscribe(state => {
            assert.equal(state.val, 10);
            done();
        });
    });

    it("select() emits value on state changes", function (done) {
        const initialState = {
            val: 10
        };

        class MyCommands extends Commands<typeof initialState> {
            inc(by: number) {
                this.state.val += by;
            }
        }

        class MyFacade extends Facade<typeof initialState, MyCommands> {
            action() {
                this.commands.inc(100);
            }
        }

        const tyduxStore = createTyduxStore(initialState);
        const collected: number[] = [];
        tyduxStore.select().subscribe(state => {
            collected.push(state.val);
        });

        const mount = tyduxStore.createMountPoint(s => s, (state, facade) => ({...facade}));
        const myFacade = new MyFacade(mount, "TestFacade", new MyCommands());
        myFacade.action();

        setTimeout(() => {
            assert.deepEqual(collected, [10, 110]);
            done();
        }, 0);
    });

    it("createTyduxStore() - with slice", async function () {
        const initialState = {
            facade: {
                val: 10
            }
        };

        class MyCommands extends Commands<typeof initialState.facade> {
            inc(by: number) {
                this.state.val += by;
            }
        }

        class MyFacade extends Facade<typeof initialState.facade, MyCommands> {
            action() {
                this.commands.inc(100);
            }
        }

        const tyduxStore = createTyduxStore(initialState);
        const mount = tyduxStore.createMountPoint(s => s.facade, (state, facade) => ({...state, facade}));
        const myFacade = new MyFacade(mount, "TestFacade", new MyCommands());
        myFacade.action();

        assert.deepEqual(tyduxStore.getState(), {
            facade: {
                val: 110
            }
        });
    });

    it("createRootMountPoint()", async function () {
        const initialState = {
            managedByFacade: {
                val: 10
            }
        };

        type ManagedByFacadeState = typeof initialState.managedByFacade;

        const tyduxBridge = new TyduxReducerBridge();
        const reduxStore = createStore(tyduxBridge.createTyduxReducer(initialState));
        const connected = tyduxBridge.connectStore(reduxStore);
        const mount = connected.createRootMountPoint("managedByFacade");

        class MyCommands extends Commands<ManagedByFacadeState> {
            inc(by: number) {
                this.state.val += by;
            }
        }

        class MyFacade extends Facade<ManagedByFacadeState, MyCommands> {
            action() {
                this.commands.inc(100);
            }
        }

        const myFacade = new MyFacade(mount, "MyFacade", new MyCommands());
        myFacade.action();

        assert.deepEqual(reduxStore.getState(), {
            managedByFacade: {
                val: 110
            }
        });
    });

    it("can be used with plain reducer", async function () {
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

        const store = createTyduxStore(initialState, undefined, plainReducer);
        const mount = store.createRootMountPoint("managedByFacade");

        store.store.dispatch({type: "inc", payload: 5});

        class MyCommands extends Commands<ManagedByFacadeState> {
            inc(by: number) {
                this.state.val += by;
            }
        }

        class MyFacade extends Facade<ManagedByFacadeState, MyCommands> {
            action() {
                this.commands.inc(100);
            }
        }

        const myFacade = new MyFacade(mount, "MyFacade", new MyCommands());
        myFacade.action();

        assert.deepEqual(store.store.getState(), {
            someValue: 5,
            managedByFacade: {
                val: 110
            }
        });
    });

    it("can be used along Redux", async function () {
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
        const mount = connected.createRootMountPoint("managedByFacade");

        reduxStore.dispatch({type: "inc", payload: 5});

        class MyCommands extends Commands<ManagedByFacadeState> {
            inc(by: number) {
                this.state.val += by;
            }
        }

        class MyFacade extends Facade<ManagedByFacadeState, MyCommands> {
            action() {
                this.commands.inc(100);
            }
        }

        const myFacade = new MyFacade(mount, "TestFacade", new MyCommands());
        myFacade.action();

        assert.deepEqual(reduxStore.getState(), {
            someValue: 5,
            managedByFacade: {
                val: 110
            }
        });
    });

});
