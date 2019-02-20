import {createStore} from "redux";
import {Commands} from "./commands";
import {Facade} from "./Facade";
import {TyduxReducerBridge, TyduxStore} from "./store";


describe("Documentation", function () {

    let oldLog: any;

    beforeEach(() => {
        oldLog = console.log;
        console.log = function () {
            // noop
        }
    });

    afterEach(() => {
        console.log = oldLog;
    });

    it("readme", async function () {
        const initialState = {
            valueA: 0,
            managedByTydux: {
                valueB: 10
            }
        };

        // bootstrap Redux
        const tyduxBridge = new TyduxReducerBridge();
        const reduxStore = createStore(tyduxBridge.createTyduxReducer(initialState));
        const tyduxStore = tyduxBridge.connectStore(reduxStore);

        type ManagedByTyduxState = { valueB: number };

        // combine actions and reducers
        class MyCommands extends Commands<ManagedByTyduxState> {
            inc(by: number) {
                this.state.valueB += by;
            }
        }

        // facade to combine commands (actions & reducers) and selectors
        class MyFacade extends Facade<ManagedByTyduxState, MyCommands> {

            constructor(tyduxStore: TyduxStore<typeof initialState>) {
                super(tyduxStore.createRootMountPoint("managedByTydux"), "MyFacade", new MyCommands());
            }

            trigger(incBy: number) {
                this.commands.inc(incBy);
            }

            selectValueB() {
                return this.select(s => s.valueB);
            }
        }

        const myFacade = new MyFacade(tyduxStore);

        // prints:
        // 10 (start value)
        // 11 (incremented by 1)
        // 31 (incremented by 20)
        myFacade.selectValueB().subscribe(value => {
            console.log(value);
        });

        myFacade.trigger(1);
        myFacade.trigger(20);

        expect(reduxStore.getState()).toEqual({
            valueA: 0,
            managedByTydux: {
                valueB: 31
            }
        });
    });

});
