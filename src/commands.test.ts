import {assert} from "chai";
import {Commands} from "./commands";
import {enableTyduxDevelopmentMode} from "./development";
import {Fassade} from "./Fassade";
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

        class TestFassade extends Fassade<{ n1: number }, TestCommands> {
            action() {
                this.commands.mut1();
            }
        }

        const tyduxStore = createTyduxStore({n1: 0});
        const mount = tyduxStore.createMountPoint(s => s, (state, fassade) => ({...fassade}));
        const fassade = new TestFassade(mount, "TestFassade", new TestCommands());

        fassade.action();
        await untilNoBufferedStateChanges(fassade);
        assert.deepEqual(fassade.state, {n1: 1});
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

        class TestFassade extends Fassade<State, TestCommands> {
            action1() {
                this.commands.mut1();
            }

            action2() {
                this.commands.mut2();
            }
        }

        const fassade = new TestFassade(createTestMount(new State()), "TestFassade", new TestCommands());

        fassade.selectNonNil(s => s.list1)
            .unbounded()
            .subscribe(() => {
                fassade.action2();
            });

        fassade.action1();

        await untilNoBufferedStateChanges(fassade);

        assert.deepEqual(fassade.state.list1, [1]);
        assert.deepEqual(fassade.state.list2, [2]);
    });

    it("methods can assign a new state", async function () {
        class TestCommands extends Commands<{ n1: number }> {
            mut1() {
                this.state = {
                    n1: 99
                };
            }
        }

        class TestFassade extends Fassade<{ n1: number }, TestCommands> {
            action() {
                this.commands.mut1();
            }
        }

        const fassade = new TestFassade(createTestMount({n1: 0}), "TestFassade", new TestCommands());
        fassade.action();
        await untilNoBufferedStateChanges(fassade);
        assert.deepEqual(fassade.state, {n1: 99});
    });

    it("can not change the state deeply", function () {
        class TestCommands extends Commands<{ n1: number[] }> {
            mut1() {
                assert.throws(() => this.state.n1.push(3), "not extensible");
            }
        }

        class TestFassade extends Fassade<{ n1: number[] }, TestCommands> {
            action() {
                this.commands.mut1();
            }
        }

        const fassade = new TestFassade(createTestMount({n1: [1, 2]}), "TestFassade", new TestCommands());
        fassade.action();
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

        class TestStore extends Fassade<{ n1: string }, TestCommands> {
            action1() {
                this.commands.mod1();
            }
        }

        const fassade = new TestStore(createTestMount({n1: ""}), "TestFassade", new TestCommands());
        let collected = collect(fassade.select(s => s.n1).unbounded());
        fassade.action1();
        await untilNoBufferedStateChanges(fassade);
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

        class TestFassade extends Fassade<{ a: number }, TestCommands> {
            action() {
                this.commands.mut1();
            }
        }

        const fassade = new TestFassade(createTestMount({a: 0}), "TestFassade", new TestCommands());
        assert.throws(() => fassade.action());
        assert.equal(fassade.state.a, 0);
    });

    it("Commandss must not have instance members", function () {
        class TestCommands extends Commands<any> {
            // noinspection JSUnusedGlobalSymbols
            abc = 1;
        }

        class TestFassade extends Fassade<any, TestCommands> {
        }

        assert.throws(
            () => new TestFassade(createTestMount({}), "TestFassade", new TestCommands()),
            /abc/
        );
    });

    it("Commandss must not create instance members", function () {
        class TestCommands extends Commands<any> {

            mut() {
                (this as any).abc = 1;
            }

        }

        class TestFassade extends Fassade<any, TestCommands> {
            action() {
                assert.throws(() => this.commands.mut(), /abc/);
            }
        }

        const fassade = new TestFassade(createTestMount({}), "TestFassade", new TestCommands());
        fassade.action();
    });

});
