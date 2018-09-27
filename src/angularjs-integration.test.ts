import {assert} from "chai";
import {AngularJS1ScopeLike, IAngularEvent, toAngularJSScope} from "./angularjs-integration";
import {enableTyduxDevelopmentMode} from "./development";
import {Commands} from "./commands";
import {Fassade} from "./Fassade";
import {createTestMount} from "./test-utils";
import {untilNoBufferedStateChanges} from "./utils";


describe("AngularJS integration", function () {

    beforeEach(() => enableTyduxDevelopmentMode());

    it("wraps the delivery of events in scope.$apply()", async function () {

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

        fassade
            .select(s => s.count)
            .bounded(toAngularJSScope(scope))
            .subscribe(a => events.push(a));

        fassade.action();

        await untilNoBufferedStateChanges(fassade);

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
