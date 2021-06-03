import {Commands, createTyduxStore, Facade, untilNoBufferedStateChanges} from "@w11k/tydux";
import {assert} from "chai";

describe("Tydux Angular", function () {

    it("tbd", async function () {
        class TestCommands extends Commands<{ n1: number }> {
            inc() {
                this.state.n1++;
            }
        }

        class TestFacade extends Facade<TestCommands> {
            actionInc() {
                this.commands.inc();
            }
        }

        const tydux = createTyduxStore();
        const facade = new TestFacade(tydux.createMountPoint("test"), {n1: 0}, new TestCommands());

        const values: any = [];
        facade.select((currentState) => {
            values.push(currentState);
        }).subscribe();

        facade.actionInc();
        facade.actionInc();

        await untilNoBufferedStateChanges(facade);

        assert.deepEqual(values, [
            {n1: 0},
            {n1: 1},
            {n1: 2},
        ]);
    });

});
