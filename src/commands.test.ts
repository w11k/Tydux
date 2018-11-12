import {assert} from "chai";
import {Commands} from "./commands";
import {enableTyduxDevelopmentMode} from "./development";
import {Facade} from "./Facade";
import {createTyduxStore} from "./store";
import {collect, createTestMount} from "./test-utils";
import {untilNoBufferedStateChanges} from "./utils";

describe("Commands", function () {

    beforeEach(() => enableTyduxDevelopmentMode());

    it("methods can assign state properties", async function () {
        class TestCommands extends Commands<{ n1: number }> {
            mut1() {
                this.state.n1 = 1;
            }
        }

        class TestFacade extends Facade<{ n1: number }, TestCommands> {
            action() {
                this.commands.mut1();
            }
        }

        const tyduxStore = createTyduxStore({n1: 0});
        const mount = tyduxStore.createMountPoint(s => s, (state, facade) => ({...facade}));
        const facade = new TestFacade(mount, "TestFacade", new TestCommands());

        facade.action();
        await untilNoBufferedStateChanges(facade);
        assert.deepEqual(facade.state, {n1: 1});
    });

    it("methods can assign state properties successively", async function () {
        class State {
            list1?: number[];
            list2: number[] = [];
        }

        class TestCommands extends Commands<State> {
            mut1() {
                this.state.list1 = [1];
            }

            mut2() {
                this.state.list2 = [2];
            }
        }

        class TestFacade extends Facade<State, TestCommands> {
            action1() {
                this.commands.mut1();
            }

            action2() {
                this.commands.mut2();
            }
        }

        const facade = new TestFacade(createTestMount(new State()), "TestFacade", new TestCommands());

        facade.selectNonNil(s => s.list1)
            .unbounded()
            .subscribe(() => {
                facade.action2();
            });

        facade.action1();

        await untilNoBufferedStateChanges(facade);

        assert.deepEqual(facade.state.list1, [1]);
        assert.deepEqual(facade.state.list2, [2]);
    });

    it("methods can assign a new state", async function () {
        class TestCommands extends Commands<{ n1: number }> {
            mut1() {
                this.state = {
                    n1: 99
                };
            }
        }

        class TestFacade extends Facade<{ n1: number }, TestCommands> {
            action() {
                this.commands.mut1();
            }
        }

        const facade = new TestFacade(createTestMount({n1: 0}), "TestFacade", new TestCommands());
        facade.action();
        await untilNoBufferedStateChanges(facade);
        assert.deepEqual(facade.state, {n1: 99});
    });

    it("can not change the state deeply", function () {
        class TestCommands extends Commands<{ n1: number[] }> {
            mut1() {
                assert.throws(() => this.state.n1.push(3), "not extensible");
            }
        }

        class TestFacade extends Facade<{ n1: number[] }, TestCommands> {
            action() {
                this.commands.mut1();
            }
        }

        const facade = new TestFacade(createTestMount({n1: [1, 2]}), "TestFacade", new TestCommands());
        facade.action();
    });

    it("nested methods are merged", async function () {
        class TestCommands extends Commands<{ n1: string }> {
            mod1() {
                this.state.n1 += "1";
                this.mod2();
                this.mod3();
            }

            mod2() {
                this.state.n1 += "2";
            }

            mod3() {
                this.state.n1 += "3";
            }
        }

        class TestStore extends Facade<{ n1: string }, TestCommands> {
            action1() {
                this.commands.mod1();
            }
        }

        const facade = new TestStore(createTestMount({n1: ""}), "TestFacade", new TestCommands());
        let collected = collect(facade.select(s => s.n1).unbounded());
        facade.action1();
        await untilNoBufferedStateChanges(facade);
        collected.assert("", "123");
    });

    it("state changes are only persistent if the Commands did not throw an exception", function () {
        class TestCommands extends Commands<any> {
            mut1() {
                this.state.count = 1;
                if (this.state.count > 0) {
                    throw new Error("");
                }
                this.state.count = 2;
            }
        }

        class TestFacade extends Facade<{ a: number }, TestCommands> {
            action() {
                this.commands.mut1();
            }
        }

        const facade = new TestFacade(createTestMount({a: 0}), "TestFacade", new TestCommands());
        assert.throws(() => facade.action());
        assert.equal(facade.state.a, 0);
    });

    it("Commandss must not have instance members", function () {
        class TestCommands extends Commands<any> {
            // noinspection JSUnusedGlobalSymbols
            abc = 1;
        }

        class TestFacade extends Facade<any, TestCommands> {
        }

        assert.throws(
            () => new TestFacade(createTestMount({}), "TestFacade", new TestCommands()),
            /abc/
        );
    });

    it("Commandss must not create instance members", function () {
        class TestCommands extends Commands<any> {

            mut() {
                (this as any).abc = 1;
            }

        }

        class TestFacade extends Facade<any, TestCommands> {
            action() {
                assert.throws(() => this.commands.mut(), /abc/);
            }
        }

        const facade = new TestFacade(createTestMount({}), "TestFacade", new TestCommands());
        facade.action();
    });

});
