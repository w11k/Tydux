import {Commands, createTestFacade} from "../public_api";

describe("test utils", () => {

    it("createTestFacade", () => {
        const state = {a: 1};
        class TestCommands extends Commands<typeof state> {
            met1() {
                this.state.a++;
            }
        }

        const facade = createTestFacade(new TestCommands(), state);
        expect(facade.state.a).toEqual(1);
        facade.commands.met1();
        expect(facade.state.a).toEqual(2);
    });

});
