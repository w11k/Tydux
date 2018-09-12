import {assert} from "chai";
import {AngularJS1ScopeLike, IAngularEvent, toAngularJSScope} from "./angularjs-integration";
import {enableTyduxDevelopmentMode} from "./development";
import {resetTydux} from "./global-state";
import {Commands} from "./commands";
import {Fassade} from "./Fassade";
import {dispatchedAllActions} from "./test-utils";


describe("AngularJS integration", function () {

    beforeEach(() => enableTyduxDevelopmentMode());

    afterEach(() => resetTydux());

    it("wraps the delivery of events in scope.$apply()", async function () {

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

        class DummyScope implements AngularJS1ScopeLike {

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

        store
            .select(s => s.count)
            .bounded(toAngularJSScope(scope))
            .subscribe(a => events.push(a));

        store.action();

        await dispatchedAllActions(store);

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
