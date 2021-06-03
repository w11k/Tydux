import {isNotNil} from "@w11k/rx-ninja";
import {filter} from "rxjs/operators";
import {createAsyncPromise, createTestFacade, createTestMount} from "../testing";
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

        class TestFacade extends Facade<TestCommands> {
            action1() {
                this.commands.mut1();
            }

            action2() {
                this.commands.mut2();
            }
        }

        const facade = new TestFacade(createTestMount(new State()), new TestCommands(), undefined);

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

        class TestFacade extends Facade<TestCommands> {
            action() {
                this.commands.mut1();
            }
        }

        const facade = new TestFacade(createTestMount({n1: 0}), new TestCommands(), undefined);
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

        class TestFacade extends Facade<TestCommands> {
            action() {
                this.commands.mut1();
            }
        }

        const facade = new TestFacade(createTestMount({n1: [1, 2]}), new TestCommands(), undefined);
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

        class TestStore extends Facade<TestCommands> {
            action1() {
                this.commands.mod1();
            }
        }

        const facade = new TestStore(createTestMount({n1: ""}), new TestCommands(), undefined);
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

        class TestFacade extends Facade<TestCommands> {
            action() {
                this.commands.mut1();
            }
        }

        const facade = new TestFacade(createTestMount({a: 0}), new TestCommands(), undefined);
        expect(() => facade.action()).toThrow();
        expect(facade.state.a).toEqual(0);
    });

    it("Commands must not have instance members", () => {
        class TestCommands extends Commands<any> {
            // noinspection JSUnusedGlobalSymbols
            abc = 1;
        }

        class TestFacade extends Facade<TestCommands> {
        }

        expect(
            () => new TestFacade(createTestMount({}), new TestCommands(), undefined)
        ).toThrow();
    });

    it("Commands must not create instance members", () => {
        class TestCommands extends Commands<any> {

            mut() {
                (this as any).abc = 1;
            }

        }

        class TestFacade extends Facade<TestCommands> {
            action() {
                expect(() => this.commands.mut()).toThrow();
            }
        }

        const facade = new TestFacade(createTestMount({}), new TestCommands(), undefined);
        facade.action();
    });

    it("methods are pulled to the instance", () => {
        class TestCommands extends Commands<any> {
            mut() {
                this.state.val = 1;
            }
        }

        class TestFacade extends Facade<TestCommands> {
            mut = this.commands.mut;
        }

        const facade = new TestFacade(createTestMount(), new TestCommands(), {});
        facade.mut();
        expect(facade.state.val).toEqual(1);
    });

});

describe("Commands - sanity tests", function () {

    beforeEach(() => enableTyduxDevelopmentMode());

    it("can not access the state asynchronously", function (done) {
        class TestCommands extends Commands<{ n1: number }> {
            mut() {
                setTimeout(() => {
                    expect(() => this.state).toThrow();
                    done();
                }, 0);
            }
        }

        class TestFacade extends Facade<TestCommands> {
            action() {
                this.commands.mut();
            }
        }

        const facade = new TestFacade(createTestMount({n1: 0}), new TestCommands(), undefined);
        facade.action();
    });

    it("can not modify the state asynchronously by keeping a reference to a nested state property", function (done) {
        class TestCommands extends Commands<{ root: { child: number[] } }> {
            mut() {
                const child = this.state.root.child;
                setTimeout(() => {
                    expect(() => child.push(3)).toThrow();
                    done();
                }, 0);
            }
        }

        class TestFacade extends Facade<TestCommands> {
            action() {
                this.commands.mut();
            }
        }

        const state = {root: {child: [1, 2]}};
        const facade = new TestFacade(createTestMount(state), new TestCommands(), undefined);
        facade.action();
    });

    it("can not replace the state asynchronously", function (done) {
        class TestCommands extends Commands<{ n1: number }> {
            mut() {
                setTimeout(() => {
                    expect(() => this.state = {n1: 99}).toThrow();
                    done();
                }, 0);
            }
        }

        class TestFacade extends Facade<TestCommands> {
            action() {
                this.commands.mut();
            }
        }

        const facade = new TestFacade(createTestMount({n1: 0}), new TestCommands(), undefined);
        facade.action();
    });

    it("can not change the state in asynchronous promise callbacks", function (done) {
        class TestCommands extends Commands<{ n1: number }> {
            mut1() {
                createAsyncPromise(1).then(val => {
                    expect(() => this.state.n1 = val).toThrow();
                    done();
                });
            }
        }

        class TestFacade extends Facade<TestCommands> {
            action() {
                this.commands.mut1();
            }
        }

        const facade = new TestFacade(createTestMount({n1: 0}), new TestCommands(), undefined);
        facade.action();
    });

    it("can not access other members asynchronously", function (done) {
        class TestCommands extends Commands<{ n1: number }> {
            mut1() {
                setTimeout(() => {
                    expect(() => this.mut2()).toThrow();
                    done();
                }, 0);
            }

            mut2() {
                // empty
            }
        }

        class TestFacade extends Facade<TestCommands> {
            action() {
                this.commands.mut1();
            }
        }

        const facade = new TestFacade(createTestMount({n1: 0}), new TestCommands(), undefined);
        facade.action();
    });

    it("can not access other members in an asynchronous promise resolve", function (done) {
        class TestCommands extends Commands<{ n1: number }> {
            mut1() {
                createAsyncPromise(1)
                    .then(() => {
                        this.mut2();
                    })
                    .catch((e: Error) => {
                        expect(e.message).toMatch(/.*Illegal access.*this.*/);
                        done();
                    });
            }

            mut2() {
                console.log(3);
                this.state.n1 = -99;
            }
        }

        class TestFacade extends Facade<TestCommands> {
            action() {
                this.commands.mut1();
            }
        }

        const facade = new TestFacade(createTestMount({n1: 0}), new TestCommands(), undefined);
        facade.action();
    });

    it("must not return a value", function () {
        class TestCommands extends Commands<any> {
            mod1() {
                return 1;
            }
        }

        class TestFacade extends Facade<TestCommands> {
            action() {
                expect(() => this.commands.mod1()).toThrow();
            }
        }

        const facade = new TestFacade(createTestMount({}), new TestCommands(), undefined);
        facade.action();
    });

});
