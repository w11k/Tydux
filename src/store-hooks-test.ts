// import "rxjs/add/operator/take";
// import {enableDevelopmentMode} from "./development";
// import {Mutators, Store} from "./Store";
// import {createSimpleStore} from "./SimpleStore";
// import {assert} from "chai";
//
//
// describe("Modifier hooks", function () {
//
//     beforeEach(function () {
//         enableDevelopmentMode();
//     });
//
//     it("before hook", function (done) {
//         class TestMutator extends Mutators<{ n1: number }> {
//             mutator() {
//                 this.state.n1++;
//             }
//         }
//
//         const store = createSimpleStore("", new TestMutator(), {n1: 0});
//         store.hooks.mutator.before.take(1).subscribe(done);
//         store.mutate.mutator();
//     });
//
//     it("after hook", function (done) {
//         class TestMutator extends Mutators<{ n1: number }> {
//             mutator() {
//                 this.state.n1++;
//             }
//         }
//
//         const store = createSimpleStore("", new TestMutator(), {n1: 0});
//         store.hooks.mutator.after.take(1).subscribe(done);
//         store.mutate.mutator();
//     });
//
//     it("after hook with asynchronous mutator", function (done) {
//         class TestMutator extends Mutators<{ n1: number }> {
//             mutator() {
//                 return new Promise<void>(resolve => {
//                     setTimeout(() => {
//                         resolve();
//                     }, 1);
//                 });
//             }
//         }
//
//         const store = createSimpleStore("", new TestMutator(), {n1: 0});
//         let hookCalled = false;
//         store.hooks.mutator.after.take(1).subscribe(() => {
//             hookCalled = true;
//         });
//         store.mutate.mutator().then(() => {
//             assert.isTrue(hookCalled);
//             done();
//         });
//     });
//
//     it("documentation", () => {
//         class MyState {
//             count = 0;
//         }
//
//         class MyMutators extends Mutators<MyState> {
//             increment() {
//                 this.state.count++;
//             }
//         }
//
//         const store = createSimpleStore("myStore", new MyMutators(), new MyState());
//
//         store.hooks.increment.before.subscribe(() => {
//             console.log("before", store.state.count);
//         });
//         store.hooks.increment.after.subscribe(() => {
//             console.log("after", store.state.count);
//         });
//
//         store.mutate.increment();
//         store.select().subscribe(state => {
//             console.log(state.count);
//         });
//     });
//
// });
