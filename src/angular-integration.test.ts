import {assert} from "chai";
import {OnDestroyLike, toAngularComponent} from "./angular-integration";
import {Commands} from "./commands";
import {enableTyduxDevelopmentMode} from "./development";
import {Facade} from "./Facade";
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

        class TestFacade extends Facade<State, TestCommands> {
            action() {
                this.commands.inc();
            }
        }

        const events: any[] = [];
        const facade = new TestFacade(createTestMount({count: 0}), "TestFacade", new TestCommands());

        class DummyComponent implements OnDestroyLike {
            ngOnDestroy() {
                events.push("ngOnDestroy");
            }
        }

        const component = new DummyComponent();

        facade
            .select(s => s.count)
            .bounded(toAngularComponent(component))
            .subscribe(a => events.push(a));

        facade.action(); // 1
        facade.action(); // 2

        await untilNoBufferedStateChanges(facade);

        component.ngOnDestroy();

        await untilNoBufferedStateChanges(facade);

        facade.action(); // 3

        await untilNoBufferedStateChanges(facade);

        assert.deepEqual(events, [
            0,
            1,
            2,
            "ngOnDestroy"
        ]);

    });

});
