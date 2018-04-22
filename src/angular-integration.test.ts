import {assert} from "chai";
import {OnDestroyLike, toAngularComponent} from "./angular-integration";
import {AngularJS1ScopeLike, IAngularEvent, toAngularJSScope} from "./angularjs-integration";
import {enableTyduxDevelopmentMode} from "./development";
import {resetTydux} from "./global-state";
import {Mutator} from "./mutator";
import {Store} from "./Store";


describe("Angular integration", function () {

    beforeEach(() => enableTyduxDevelopmentMode());

    afterEach(() => resetTydux());

    it("completes all subscriptions when the component gets destroyed", function () {

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
        component.ngOnDestroy();
        store.action(); // 3

        assert.deepEqual(events, [
            0,
            1,
            2,
            "ngOnDestroy"
        ]);

    });

});
