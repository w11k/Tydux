import {createCommandsActionTypeNames} from "../lib/global-facade-registry";
import {Commands, createTyduxStore, Facade} from "../public_api";
import {ActionRecorder} from "./action-recorder";

describe("ActionRecorder", () => {

    it("records all action names", () => {
        const state = {a: 1};

        class MyCommands extends Commands<typeof state> {
            incrementBy(by: number) {
                this.state.a += by;
            }

            decrement() {
                this.state.a--;
            }
        }

        class MyFacade extends Facade<typeof state, MyCommands> {
            op1() {
                this.commands.incrementBy(1);
                this.commands.incrementBy(2);
                this.commands.incrementBy(3);
                this.commands.decrement();
            }
        }

        const recorder = new ActionRecorder();
        const tyduxStore = createTyduxStore({MyTest: state}, {
            reducer: recorder.getReducer()
        });

        const testFacade = new MyFacade(tyduxStore.createMountPoint("MyTest"), state, new MyCommands());
        const actionTypes = createCommandsActionTypeNames(testFacade);

        testFacade.op1();

        const incrementCount = recorder.getActionCount(actionTypes.incrementBy);
        expect(incrementCount).toEqual(3);

        const first = recorder.getFirstActionAndStateForType(actionTypes.incrementBy);
        expect(first!.state.MyTest.a).toEqual(1);

        const last = recorder.getLastActionAndStateForType(actionTypes.incrementBy);
        expect(last!.state.MyTest.a).toEqual(4);


    });

});
