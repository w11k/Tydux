import {assert} from "chai";
import {OnDestroyLike, toAngularComponent} from "./angular-integration";
import {enableTyduxDevelopmentMode} from "./development";
import {Commands} from "./commands";
import {Fassade} from "./Fassade";
import {createTestMount} from "./test-utils";
import {untilNoBufferedStateChanges} from "./utils";


describe("Angular integration", function () {

    beforeEach(() => enableTyduxDevelopmentMode());

    it("completes all subscriptions when the component gets destroyed", async function () {

        type State = { count: number };

        class TestCommands extends Commands<State> {
            inc() {
                this.state.count++;
            }
        }

        class TestFassade extends Fassade<State, TestCommands> {
            createCommands() {
                return new TestCommands();
            }

            action() {
                this.commands.inc();
            }
        }

        const events: any[] = [];
        const fassade = new TestFassade(createTestMount({count: 0}));

        class DummyComponent implements OnDestroyLike {
            ngOnDestroy() {
                events.push("ngOnDestroy");
            }
        }

        const component = new DummyComponent();

        fassade
            .select(s => s.count)
            .bounded(toAngularComponent(component))
            .subscribe(a => events.push(a));

        fassade.action(); // 1
        fassade.action(); // 2

        await untilNoBufferedStateChanges(fassade);

        component.ngOnDestroy();

        await untilNoBufferedStateChanges(fassade);

        fassade.action(); // 3

        await untilNoBufferedStateChanges(fassade);

        assert.deepEqual(events, [
            0,
            1,
            2,
            "ngOnDestroy"
        ]);

    });

});
