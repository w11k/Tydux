import {isNotNil} from "@w11k/rx-ninja";
import {filter} from "rxjs/operators";
import {createTestFacade, createTestMount} from "../testing";
import {collect} from "../testing/test-utils-internal";
import {Commands, CommandsInvoker} from "./commands";
import {enableTyduxDevelopmentMode} from "./development";
import {Facade} from "./Facade";
import {untilNoBufferedStateChanges} from "./utils";

describe("Commands", () => {

    beforeEach(() => enableTyduxDevelopmentMode());

    it("CommandsInvoker", () => {
        class TestCommands extends Commands<{ n1: number }> {
            mut1() {
                this.state.n1++;
            }
        }

        const ci = new CommandsInvoker(new TestCommands());
        const newState = ci.invoke({n1: 1}, c => c.mut1());
        expect(newState).toEqual({n1: 2});
    });

    it("methods can assign state properties", async () => {

        class TestCommands extends Commands<{ n1: number }> {
            mut1() {
                this.state.n1 = 1;
            }
        }

        const facade = createTestFacade(new TestCommands(), {n1: 0});
        facade.commands.mut1();

        expect(facade.state).toEqual({n1: 1});
    });

    it("methods can assign state properties successively", async () => {
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

        facade.select(s => s.list1)
            .pipe(
                filter(s => isNotNil(s))
            )

            .subscribe(() => {
                facade.action2();
            });

        facade.action1();

        await untilNoBufferedStateChanges(facade);

        expect(facade.state.list1).toEqual([1]);
        expect(facade.state.list2).toEqual([2]);
    });

    it("methods can assign a new state", async () => {
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
        expect(facade.state).toEqual({n1: 99});
    });

    it("can not change the state deeply", () => {
        class TestCommands extends Commands<{ n1: number[] }> {
            mut1() {
                expect(() => this.state.n1.push(3)).toThrow();
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

    it("nested methods are merged", async () => {
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
        const collected = collect(facade.select(s => s.n1));
        facade.action1();
        await untilNoBufferedStateChanges(facade);
        collected.assert("", "123");
    });

    it("state changes are only persistent if the Commands did not throw an exception", () => {
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
        expect(() => facade.action()).toThrow();
        expect(facade.state.a).toEqual(0);
    });

    it("Commandss must not have instance members", () => {
        class TestCommands extends Commands<any> {
            // noinspection JSUnusedGlobalSymbols
            abc = 1;
        }

        class TestFacade extends Facade<any, TestCommands> {
        }

        expect(
            () => new TestFacade(createTestMount({}), "TestFacade", new TestCommands())
        ).toThrow();
    });

    it("Commandss must not create instance members", () => {
        class TestCommands extends Commands<any> {

            mut() {
                (this as any).abc = 1;
            }

        }

        class TestFacade extends Facade<any, TestCommands> {
            action() {
                expect(() => this.commands.mut()).toThrow();
            }
        }

        const facade = new TestFacade(createTestMount({}), "TestFacade", new TestCommands());
        facade.action();
    });

});
