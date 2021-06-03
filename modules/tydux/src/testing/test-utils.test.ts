import {take} from "rxjs/operators";
import {Commands} from "../lib/commands";
import {createTestFacade, FacadeMock} from "./test-utils";

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

    it("FacadeMock", async () => {
        const initialState = {a: 1};

        class MyMockedFacade extends FacadeMock<{ a: number }> {
            constructor(initialState: { a: number }) {
                super(initialState);
            }
        }

        const facade = new MyMockedFacade(initialState);
        expect(facade.state).toEqual(initialState);
        const updatedState = {a: 2};
        const update$ = facade.select(s => s.a).pipe(take(2)).toPromise();
        facade.setState(updatedState);

        expect(facade.state).toEqual(updatedState);

        const updatedValue = await update$;
        expect(updatedValue).toBe(2);
    });
});
