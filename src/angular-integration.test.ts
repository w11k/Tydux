import {assert} from "chai";
import {OnDestroyLike, toAngularComponent} from "./angular-integration";
import {enableTyduxDevelopmentMode} from "./development";
import {resetTydux} from "./global-state";
import {Mutator} from "./mutator";
import {Store} from "./Store";
import {afterAllStoreEvents} from "./test-utils";


describe("Angular integration", function () {

    beforeEach(() => enableTyduxDevelopmentMode());

    afterEach(() => resetTydux());

    it("completes all subscriptions when the component gets destroyed", async function () {

        type State = { a: number };

        class TestMutator extends Mutator<State> {
            inc() {
                this.state.a++;
            }
        }

        class TestStore extends Store<TestMutator, State> {
            action() {
                this.mutate.inc();
            }
        }

        const events: any[] = [];
        const store = new TestStore("", new TestMutator(), {a: 0});

        class DummyComponent implements OnDestroyLike {
            ngOnDestroy() {
                events.push("ngOnDestroy");
            }
        }

        const component = new DummyComponent();

        store.bounded(toAngularComponent(component))
            .select(s => s.a)
            .subscribe(a => events.push(a));

        store.action(); // 1
        store.action(); // 2

        await afterAllStoreEvents(store);

        component.ngOnDestroy();

        await afterAllStoreEvents(store);

        store.action(); // 3

        await afterAllStoreEvents(store);

        assert.deepEqual(events, [
            0,
            1,
            2,
            "ngOnDestroy"
        ]);

    });

});
