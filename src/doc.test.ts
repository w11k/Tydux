import {assert} from "chai";
import {createStore} from "redux";
import {Commands} from "./commands";
import {Fassade} from "./Fassade";
import {TyduxStore, TyduxStoreBridge} from "./store";


describe("Documentation", function () {

    it("readme", async function () {
        const initialState = {
            valueA: 0,
            managedByTydux: {
                valueB: 10
            }
        };

        const tyduxBridge = new TyduxStoreBridge();
        const reduxStore = createStore(tyduxBridge.createTyduxReducer(initialState));
        const tyduxStore = tyduxBridge.connectStore(reduxStore);

        type ManagedByTyduxState = {valueB: number};

        class MyCommands extends Commands<ManagedByTyduxState> {
            inc(by: number) {
                this.state.valueB += by;
            }
        }

        class MyFassade extends Fassade<ManagedByTyduxState, MyCommands> {

            constructor(tyduxStore: TyduxStore<typeof initialState>) {
                super(tyduxStore.createRootMountPoint("managedByTydux"));
            }

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

        const myFassade = new MyFassade(tyduxStore);
        myFassade.action();

        assert.deepEqual(reduxStore.getState(), {
            valueA: 0,
            managedByTydux: {
                valueB: 110
            }
        });
    });

});
