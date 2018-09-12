import {assert} from "chai";
import {OnDestroyLike, toAngularComponent} from "./angular-integration";
import {enableTyduxDevelopmentMode} from "./development";
import {resetTydux} from "./global-state";
import {Commands} from "./commands";
import {Fassade} from "./Fassade";
import {dispatchedAllActions} from "./test-utils";


describe("Angular integration", function () {

    beforeEach(() => enableTyduxDevelopmentMode());

    afterEach(() => resetTydux());

    it("completes all subscriptions when the component gets destroyed", async function () {

        type State = { a: number };

        class TestMutator extends Commands<State> {
            inc() {
                this.state.count++;
            }
        }

        class TestStore extends Fassade<TestMutator, State> {
            action() {
                this.commands.inc();
            }
        }

        const events: any[] = [];
        const store = new TestStore("", new TestMutator(), {count: 0});

        class DummyComponent implements OnDestroyLike {
            ngOnDestroy() {
                events.push("ngOnDestroy");
            }
        }

        const component = new DummyComponent();

        store
            .select(s => s.count)
            .bounded(toAngularComponent(component))
            .subscribe(a => events.push(a));

        store.action(); // 1
        store.action(); // 2

        await dispatchedAllActions(store);

        component.ngOnDestroy();

        await dispatchedAllActions(store);

        store.action(); // 3

        await dispatchedAllActions(store);

        assert.deepEqual(events, [
            0,
            1,
            2,
            "ngOnDestroy"
        ]);

    });

});
