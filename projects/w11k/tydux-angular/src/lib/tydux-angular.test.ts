import {Commands, Facade, createTestMount, untilNoBufferedStateChanges} from "@w11k/tydux";
import {assert} from "chai";

describe("Tydux Angular", function () {

    it("tbd", async function () {
        class TestCommands extends Commands<{ n1: number }> {
            inc() {
                this.state.n1++;
            }
        }

        class TestFacade extends Facade<{ n1: number }, TestCommands> {
            actionInc() {
                this.commands.inc();
            }
        }

        const mount = createTestMount({n1: 0});
        const facade = new TestFacade(mount, "TestFacade", new TestCommands());

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
