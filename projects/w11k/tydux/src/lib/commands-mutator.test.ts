import {createTestMount} from "../testing";
import {Commands} from "./commands";
import {createAssignFieldCommand} from "./commands-mutators";
import {enableTyduxDevelopmentMode} from "./development";
import {Facade} from "./Facade";


describe("Commands mutators", () => {

    beforeEach(() => enableTyduxDevelopmentMode());

    it("assignFieldCommand", () => {
        class TestCommands extends Commands<{ n1: number }> {
            setN1 = createAssignFieldCommand(this, "n1");
        }

        class TestFacade extends Facade<{ n1: number }, TestCommands> {
            constructor() {
                super(createTestMount({n1: 1}), undefined, new TestCommands());
            }

            op1() {
                this.commands.setN1(99);
            }
        }

        const tf = new TestFacade();
        expect(tf.state.n1).toEqual(1);
        tf.op1();
        expect(tf.state.n1).toEqual(99);
    });

});
