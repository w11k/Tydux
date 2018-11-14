import {assert} from "chai";
import {Commands} from "./commands";
import {enableTyduxDevelopmentMode} from "./development";
import {Facade} from "./Facade";
import {createTyduxStore} from "./store";
import {collect, createAsyncPromise} from "./test-utils";
import {untilNoBufferedStateChanges} from "./utils";


describe("Facade - sanity tests", function () {

    beforeEach(() => enableTyduxDevelopmentMode());

    it("can not modify the state directly", function () {
        class TestFacade extends Facade<any, any> {
            action() {
                (this.state as any).count = 1;
            }
        }

        const tyduxStore = createTyduxStore({});
        const mount = tyduxStore.createMountPoint(s => s, (state, facade) => ({...facade}));
        const facade = new TestFacade(mount, "TestFacade", Commands);
        assert.throws(() => facade.action());
    });

    it("can not assign the state", function () {
        class TestFacade extends Facade<any, any> {
            action() {
                (this.state as any) = {};
            }
        }

        const tyduxStore = createTyduxStore({});
        const mount = tyduxStore.createMountPoint(s => s, (state, facade) => ({...facade}));
        const facade = new TestFacade(mount, "TestFacade", Commands);
        assert.throws(() => facade.action());
    });

    it("member method can use async/await", async function () {
        class MyState {
            count = 0;
        }

        class TestCommands extends Commands<MyState> {
            incrementBy(by: number) {
                this.state.count += by;
            }
        }

        class TestFacade extends Facade<MyState, TestCommands> {
            async action() {
                this.commands.incrementBy(1);
                const by = await createAsyncPromise(10);
                this.commands.incrementBy(by);

                await untilNoBufferedStateChanges(facade);

                collected.assert(0, 1, 11);
            }
        }

        const tyduxStore = createTyduxStore(new MyState());
        const mount = tyduxStore.createMountPoint(s => s, (state, facade) => ({...facade}));
        const facade = new TestFacade(mount, "TestFacade", new TestCommands());
        let collected = collect(facade.select(s => s.count).unbounded());
        facade.action();
    });

    it("member method can use member variables", function () {
        class TestFacade extends Facade<any, any> {

            counterA?: number;

            counterB = 1;

            action() {
                this.counterA = 10;
                this.innerAction();
            }

            private innerAction() {
                this.counterB = 20;
            }
        }

        const tyduxStore = createTyduxStore({});
        const mount = tyduxStore.createMountPoint(s => s, (state, facade) => ({...facade}));
        const facade = new TestFacade(mount, "TestFacade", Commands);
        facade.action();
        assert.equal(facade.counterA, 10);
        assert.equal(facade.counterB, 20);
    });

    it("member method can use async/await and instance variables", function (done) {
        class TestFacade extends Facade<any, any> {

            counter = 0;

            async action() {
                this.counter = 10;
                await createAsyncPromise(10);
                this.counter++;

                setTimeout(() => {
                    assert.equal(this.counter, 11);
                    done();
                }, 0);

            }
        }

        const tyduxStore = createTyduxStore({});
        const mount = tyduxStore.createMountPoint(s => s, (state, facade) => ({...facade}));
        const store = new TestFacade(mount, "TestFacade", Commands);
        store.action();
    });

    it("member methods and invoked sibling methods access the same instance variables", function () {
        class TestFacade extends Facade<any, any> {

            counter = 0;

            action() {
                this.counter = 10;
                this.check();
            }

            private check() {
                assert.equal(this.counter, 10);
            }
        }

        const tyduxStore = createTyduxStore({});
        const mount = tyduxStore.createMountPoint(s => s, (state, facade) => ({...facade}));
        const store = new TestFacade(mount, "TestFacade", Commands);
        store.action();
    });

    it("member method can use async/await and call sibling methods", function (done) {
        class TestFacade extends Facade<any, any> {

            chars = "A";

            async action() {
                this.chars += "B";
                this.append();
                await createAsyncPromise(10);
                this.chars += "C";
                this.append();
                this.chars += "E";

                setTimeout(() => {
                    assert.equal(this.chars, "ABXCXE");
                    done();
                }, 0);
            }

            private append() {
                this.chars += "X";
            }
        }

        const tyduxStore = createTyduxStore({});
        const mount = tyduxStore.createMountPoint(s => s, (state, facade) => ({...facade}));
        const facade = new TestFacade(mount, "TestFacade", Commands);
        facade.action();
    });

    it("exception in action method does not revert changes to instance variables", function () {
        class TestFacade extends Facade<any, any> {

            chars = "";

            action() {
                this.chars = "A";
                throw new Error();
            }
        }

        const tyduxStore = createTyduxStore({});
        const mount = tyduxStore.createMountPoint(s => s, (state, facade) => ({...facade}));
        const facade = new TestFacade(mount, "TestFacade", Commands);

        try {
            facade.action();
        } catch (e) {
            // ignore
        }
        assert.equal(facade.chars, "A");
    });

});
