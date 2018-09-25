import {assert} from "chai";
import {Commands} from "./commands";
import {Fassade} from "./Fassade";
import {createTyduxStore} from "./store";
import {untilNoBufferedStateChanges} from "./test-utils";

export class NoCommands extends Commands<any> {
}

describe("Commands", function () {

    it("methods can assign state properties", async function () {
        class TestCommands extends Commands<{ n1: number }> {
            mut1() {
                this.state.n1 = 1;
            }
        }

        class TestFassade extends Fassade<{ n1: number }, TestCommands> {
            action() {
                this.commands.mut1();
            }

            createCommands() {
                return new TestCommands();
            }
        }

        const tyduxStore = createTyduxStore({n1: 0});
        const mount = tyduxStore.createMountPoint(s => s, (state, fassade) => ({...fassade}));
        const fassade = new TestFassade(mount);

        fassade.action();
        await untilNoBufferedStateChanges(fassade);
        assert.deepEqual(fassade.state, {n1: 1});
    });

    // it("methods can assign state properties successively", async function () {
    //     class State {
    //         list1?: number[];
    //         list2: number[] = [];
    //     }
    //
    //     class TestCommands extends Commands<State> {
    //         mut1() {
    //             this.state.list1 = [1];
    //         }
    //
    //         mut2() {
    //             this.state.list2 = [2];
    //         }
    //     }
    //
    //     class TestFassade extends Fassade<TestCommands, State> {
    //         action1() {
    //             this.commands.mut1();
    //         }
    //
    //         action2() {
    //             this.commands.mut2();
    //         }
    //     }
    //
    //     const store = new TestFassade("", new TestCommands(), new State());
    //
    //     store.selectNonNil(s => s.list1)
    //         .unbounded()
    //         .subscribe(() => {
    //             store.action2();
    //         });
    //
    //     store.action1();
    //
    //     await afterAllStoreEvents(store);
    //
    //     assert.deepEqual(store.state.list1, [1]);
    //     assert.deepEqual(store.state.list2, [2]);
    // });
    //
    // it("methods can assign a new state", function () {
    //     class TestCommands extends Commands<{ n1: number }> {
    //         mut1() {
    //             this.state = {
    //                 n1: 1
    //             };
    //         }
    //     }
    //
    //     class TestFassade extends Fassade<TestCommands, { n1: number }> {
    //         action() {
    //             this.commands.mut1();
    //         }
    //     }
    //
    //     const store = new TestFassade("", new TestCommands(), {n1: 0});
    //     store.action();
    //     assert.deepEqual(store.state, {n1: 1});
    // });
    //
    // it("can not change the state deeply", function () {
    //     class TestCommands extends Commands<{ n1: number[] }> {
    //         mut1() {
    //             assert.throws(() => this.state.n1.push(3), "not extensible");
    //         }
    //     }
    //
    //     class TestFassade extends Fassade<TestCommands, { n1: number[] }> {
    //         action() {
    //             this.commands.mut1();
    //         }
    //     }
    //
    //     const store = new TestFassade("", new TestCommands(), {n1: [1, 2]});
    //     store.action();
    // });
    //
    // it("nested methods are merged", async function () {
    //     class TestCommands extends Commands<{ n1: string }> {
    //         mod1() {
    //             this.state.n1 += "1";
    //             this.mod2();
    //             this.mod3();
    //         }
    //
    //         mod2() {
    //             this.state.n1 += "2";
    //         }
    //
    //         mod3() {
    //             this.state.n1 += "3";
    //         }
    //     }
    //
    //     class TestStore extends Fassade<TestCommands, { n1: string }> {
    //         action1() {
    //             this.commands.mod1();
    //         }
    //     }
    //
    //     const store = new TestStore("TestStore", new TestCommands(), {n1: ""});
    //     let collected = collect(store.select(s => s.n1).unbounded());
    //     store.action1();
    //     await afterAllStoreEvents(store);
    //     collected.assert("", "123");
    // });
    //
    // it("state changes are only persistent if the Commands did not throw an exception", function () {
    //     class TestCommands extends Commands<any> {
    //         mut1() {
    //             this.state.count = 1;
    //             if (this.state.count > 0) {
    //                 throw new Error("");
    //             }
    //             this.state.count = 2;
    //         }
    //     }
    //
    //     class TestFassade extends Fassade<TestCommands, { a: number }> {
    //         action() {
    //             this.commands.mut1();
    //         }
    //     }
    //
    //     const store = new TestFassade("", new TestCommands(), {count: 0});
    //     assert.throws(() => store.action());
    //     assert.equal(store.state.count, 0);
    // });
    //
    // it("Commandss must not have instance members", function () {
    //     class MyCommandss extends Commands<any> {
    //         noinspection JSUnusedGlobalSymbols
    // abc = 1;
    // }
    //
    // class TestFassade extends Fassade<MyCommandss, any> {
    // }
    //
    // assert.throws(
    //     () => new TestFassade("TestFassade", new MyCommandss(), {}),
    //     /abc/
    // );
    // });
    //
    // it("Commandss must not create instance members", function () {
    //     class MyCommandss extends Commands<any> {
    //
    //         mut() {
    //             (this as any).abc = 1;
    //         }
    //
    //     }
    //
    //     class TestFassade extends Fassade<MyCommandss, any> {
    //         action() {
    //             assert.throws(() => this.commands.mut(), /abc/);
    //         }
    //     }
    //
    //     const store = new TestFassade("TestFassade", new MyCommandss(), {});
    //     store.action();
    // });

});
