import {assert} from "chai";
import {OnDestroyLike, toAngularComponent} from "./angular-integration";
import {Commands} from "./commands";
import {enableTyduxDevelopmentMode} from "./development";
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
            action() {
                this.commands.inc();
            }
        }

        const events: any[] = [];
        const fassade = new TestFassade(createTestMount({count: 0}), "TestFassade", new TestCommands());

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
