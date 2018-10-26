import {assert} from "chai";
import {createStore} from "redux";
import {Commands} from "./commands";
import {Fassade} from "./Fassade";
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

        // fassade to combine commands (actions & reducers) and selectors
        class MyFassade extends Fassade<ManagedByTyduxState, MyCommands> {

            constructor(tyduxStore: TyduxStore<typeof initialState>) {
                super(tyduxStore.createRootMountPoint("managedByTydux"), "MyFassade", new MyCommands());
            }

            trigger(incBy: number) {
                this.commands.inc(incBy);
            }

            selectValueB() {
                return this.select(s => s.valueB);
            }
        }

        const myFassade = new MyFassade(tyduxStore);

        // prints:
        // 10 (start value)
        // 11 (incremented by 1)
        // 31 (incremented by 20)
        myFassade.selectValueB().unbounded().subscribe(value => {
            console.log(value);
        });

        myFassade.trigger(1);
        myFassade.trigger(20);

        assert.deepEqual(reduxStore.getState(), {
            valueA: 0,
            managedByTydux: {
                valueB: 31
            }
        });
    });

});
