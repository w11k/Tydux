import {assert} from "chai";
import {AngularJS1ScopeLike, IAngularEvent, toAngularJSScope} from "./angularjs-integration";
import {enableTyduxDevelopmentMode} from "./development";
import {StateMutators} from "./mutators";
import {Store} from "./Store";


describe("AngularJS integration", function () {

    beforeEach(() => enableTyduxDevelopmentMode());

    it("wraps the delivery of events in scope.$apply()", function () {

        const state = {
            count: 0
        };

        class CounterStateGroup extends StateMutators<typeof state> {
            increment() {
                this.state.count++;
            }
        }

        const rootStateGroup = {
            counter: new CounterStateGroup(state)
        };

        const store = Store.create(rootStateGroup);

        const events: any[] = [];

        class DummyScope implements AngularJS1ScopeLike {

            // noinspection JSUnusedGlobalSymbols: required for interface
            $$phase = "";

            constructor(public $root?: AngularJS1ScopeLike) {
            }

            $apply(exp: (scope: AngularJS1ScopeLike) => any) {
                events.push("pre");
                exp(this);
                events.push("post");
            }

            $on(name: string, listener: (event: IAngularEvent, ...args: any[]) => any) {
                return () => {
                };
            }
        }

        const rootScope = new DummyScope();
        const scope = new DummyScope(rootScope);

        store.bounded(toAngularJSScope(scope))
            .select(s => s.counter.count)
            .subscribe(a => events.push(a));

        store.mutate.counter.increment();

        assert.deepEqual(events, [
            "pre",
            0,
            "post",
            "pre",
            1,
            "post",
        ]);

    });

});
