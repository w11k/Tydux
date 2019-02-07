// import {assert} from "chai";
// import {AngularJS1ScopeLike, IAngularEvent, scoped} from "./angularjs-integration";
// import {Commands} from "./commands";
// import {enableTyduxDevelopmentMode} from "./development";
// import {Facade} from "./Facade";
// import {createTestMount} from "./test-utils";
// import {untilNoBufferedStateChanges} from "./utils";
//
//
// describe("AngularJS integration", function () {
//
//     beforeEach(() => enableTyduxDevelopmentMode());
//
//     it("wraps the delivery of events in scope.$apply()", async function () {
//
//         type State = { count: number };
//
//         class TestCommands extends Commands<State> {
//             inc() {
//                 this.state.count++;
//             }
//         }
//
//         class TestFacade extends Facade<State, TestCommands> {
//             action() {
//                 this.commands.inc();
//             }
//         }
//
//         const events: any[] = [];
//         const facade = new TestFacade(createTestMount({count: 0}), "TestFacade", new TestCommands());
//
//         class DummyScope implements AngularJS1ScopeLike {
//
//             $$phase = "";
//
//             constructor(public $root?: AngularJS1ScopeLike) {
//             }
//
//             $apply(exp: (scope: AngularJS1ScopeLike) => any) {
//                 events.push("pre");
//                 exp(this);
//                 events.push("post");
//             }
//
//             $on(name: string, listener: (event: IAngularEvent, ...args: any[]) => any) {
//                 return () => {
//                 };
//             }
//         }
//
//         const rootScope = new DummyScope();
//         const scope = new DummyScope(rootScope);
//
//         facade
//             .select(s => s.count)
//             .lift(scoped(scope))
//             .subscribe(a => events.push(a));
//
//         facade.action();
//
//         await untilNoBufferedStateChanges(facade);
//
//         assert.deepEqual(events, [
//             "pre",
//             0,
//             "post",
//             "pre",
//             1,
//             "post",
//         ]);
//
//     });
//
// });
