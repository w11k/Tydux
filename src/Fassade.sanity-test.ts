import {assert} from "chai";
import {Commands} from "./commands";
import {enableTyduxDevelopmentMode} from "./development";
import {Fassade} from "./Fassade";
import {createTyduxStore} from "./store";
import {collect, createAsyncPromise} from "./test-utils";
import {untilNoBufferedStateChanges} from "./utils";


describe("Fassade - sanity tests", function () {

    beforeEach(() => enableTyduxDevelopmentMode());

    it("can not modify the state directly", function () {
        class TestFassade extends Fassade<any, any> {
            action() {
                (this.state as any).count = 1;
            }
        }

        const tyduxStore = createTyduxStore({});
        const mount = tyduxStore.createMountPoint(s => s, (state, fassade) => ({...fassade}));
        const fassade = new TestFassade(mount, "TestFassade", new Commands());
        assert.throws(() => fassade.action());
    });

    it("can not assign the state", function () {
        class TestFassade extends Fassade<any, any> {
            action() {
                (this.state as any) = {};
            }
        }

        const tyduxStore = createTyduxStore({});
        const mount = tyduxStore.createMountPoint(s => s, (state, fassade) => ({...fassade}));
        const fassade = new TestFassade(mount, "TestFassade", new Commands());
        assert.throws(() => fassade.action());
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

        class TestFassade extends Fassade<MyState, TestCommands> {
            async action() {
                this.commands.incrementBy(1);
                const by = await createAsyncPromise(10);
                this.commands.incrementBy(by);

                await untilNoBufferedStateChanges(fassade);

                collected.assert(0, 1, 11);
            }
        }

        const tyduxStore = createTyduxStore(new MyState());
        const mount = tyduxStore.createMountPoint(s => s, (state, fassade) => ({...fassade}));
        const fassade = new TestFassade(mount, "TestFassade", new TestCommands());
        let collected = collect(fassade.select(s => s.count).unbounded());
        fassade.action();
    });

    it("member method can use member variables", function () {
        class TestFassade extends Fassade<any, any> {

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
        const mount = tyduxStore.createMountPoint(s => s, (state, fassade) => ({...fassade}));
        const fassade = new TestFassade(mount, "TestFassade", new Commands());
        fassade.action();
        assert.equal(fassade.counterA, 10);
        assert.equal(fassade.counterB, 20);
    });

    it("member method can use async/await and instance variables", function (done) {
        class TestFassade extends Fassade<any, any> {

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
        const mount = tyduxStore.createMountPoint(s => s, (state, fassade) => ({...fassade}));
        const store = new TestFassade(mount, "TestFassade", new Commands());
        store.action();
    });

    it("member methods and invoked sibling methods access the same instance variables", function () {
        class TestFassade extends Fassade<any, any> {

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
        const mount = tyduxStore.createMountPoint(s => s, (state, fassade) => ({...fassade}));
        const store = new TestFassade(mount, "TestFassade", new Commands());
        store.action();
    });

    it("member method can use async/await and call sibling methods", function (done) {
        class TestFassade extends Fassade<any, any> {

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
        const mount = tyduxStore.createMountPoint(s => s, (state, fassade) => ({...fassade}));
        const fassade = new TestFassade(mount, "TestFassade", new Commands());
        fassade.action();
    });

    it("exception in action method does not revert changes to instance variables", function () {
        class TestFassade extends Fassade<any, any> {

            chars = "";

            action() {
                this.chars = "A";
                throw new Error();
            }
        }

        const tyduxStore = createTyduxStore({});
        const mount = tyduxStore.createMountPoint(s => s, (state, fassade) => ({...fassade}));
        const fassade = new TestFassade(mount, "TestFassade", new Commands());

        try {
            fassade.action();
        } catch (e) {
            // ignore
        }
        assert.equal(fassade.chars, "A");
    });

});
