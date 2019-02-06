import {Commands} from "./commands";
import {enableTyduxDevelopmentMode} from "./development";
import {Facade} from "./Facade";
import {createTyduxStore} from "./store";
import {collect} from "./test-utils";
import {untilNoBufferedStateChanges} from "./utils";
import {View} from "./view";
import {assert} from "chai";

// Store 1
class State1 {
    value1 = 10;
}

class Commands1 extends Commands<State1> {
    mut1() {
        this.state.value1++;
    }
}

class Facade1 extends Facade<State1, Commands1> {
    action1() {
        this.commands.mut1();
    }
}

// Store 2
class State2 {
    value2 = 20;
}

class Commands2 extends Commands<State2> {
    mut2() {
        this.state.value2++;
    }
}

class Facade2 extends Facade<State2, Commands2> {
    action2() {
        this.commands.mut2();
    }
}

describe("View", function () {

    beforeEach(function () {
        enableTyduxDevelopmentMode();
    });

    it("starts with the current values", async function () {
        const store = createTyduxStore({
            state1: new State1(),
            state2: new State2(),
        });

        const fac1 = new Facade1(store.createRootMountPoint("state1"), "facade1", new Commands1());
        const fac2 = new Facade2(store.createRootMountPoint("state2"), "facade2", new Commands2());

        const view = new View({
            fac1: fac1,
            child1: {
                child2: {
                    store2: fac2
                }
            }
        });

        let collected = collect(view.select(s => ({
            v1: s.fac1.value1,
            v2: s.child1.child2.store2.value2
        })));

        collected.assert(
            {v1: 10, v2: 20}
        );
    });

    it("emits changes", async function () {
        const store = createTyduxStore({
            state1: new State1(),
            state2: new State2(),
        });

        const fac1 = new Facade1(store.createRootMountPoint("state1"), "facade1", new Commands1());
        const fac2 = new Facade2(store.createRootMountPoint("state2"), "facade2", new Commands2());

        fac1.action1();
        await untilNoBufferedStateChanges(fac1);

        fac2.action2();
        await untilNoBufferedStateChanges(fac2);

        const view = new View({
            child1: {
                child2: {
                    fac1,
                    fac2
                }
            }
        });

        let collected = collect(view.select());

        fac1.action1();
        fac1.action1();
        fac2.action2();

        await untilNoBufferedStateChanges(fac1);
        await untilNoBufferedStateChanges(fac2);

        collected.assert(
            {child1: {child2: {fac1: {value1: 11}, fac2: {value2: 21}}}},
            {child1: {child2: {fac1: {value1: 12}, fac2: {value2: 21}}}},
            {child1: {child2: {fac1: {value1: 13}, fac2: {value2: 21}}}},
            {child1: {child2: {fac1: {value1: 13}, fac2: {value2: 22}}}},
        );
    });

    it("always freezes the state", async function () {
        const store = createTyduxStore({
            state1: new State1()
        });

        const fac1 = new Facade1(store.createRootMountPoint("state1"), "facade1", new Commands1());

        const view = new View({
            child1: {
                child2: {
                    fac1: fac1
                }
            }
        });

        let called = false;
        view.select().subscribe(s => {
            assert.throws(() => {
                (s.child1 as any)["a"] = "a";
            });
            assert.throws(() => {
                s.child1.child2.fac1.value1 = 10;
            });
            called = true;
        });
        assert.isTrue(called);
    });

    it("select() filters the event stream", async function () {
        const store = createTyduxStore({
            state1: new State1(),
            state2: new State2(),
        });

        const fac1 = new Facade1(store.createRootMountPoint("state1"), "facade1", new Commands1());
        const fac2 = new Facade2(store.createRootMountPoint("state2"), "facade2", new Commands2());
        const view = new View({fac1, fac2});

        const values: any[] = [];
        view
            .select(s => {
                return {
                    v1: s.fac1.value1
                };
            })

            .subscribe(v => {
                values.push([v.v1]);
            });

        fac2.action2();

        await untilNoBufferedStateChanges(fac1);
        await untilNoBufferedStateChanges(fac2);

        assert.deepEqual(values, [
            [10],
        ]);
    });

    it("StateObserver#select() directly provides the structure to select from (1 observer)", function (done) {
        const store = createTyduxStore({
            state1: new State1(),
            state2: new State2(),
        });

        const fac1 = new Facade1(store.createRootMountPoint("state1"), "facade1", new Commands1());
        const fac2 = new Facade2(store.createRootMountPoint("state2"), "facade2", new Commands2());
        const view = new View({fac1, fac2});

        view
            .select(vs => {
                assert.equal(vs.fac1.value1, 10);
                assert.equal(vs.fac2.value2, 20);
                done();
            })

            .subscribe();
    });

    it("StateObserver#select() directly provides the structure to select from (2 observers)", function (done) {
        const store = createTyduxStore({
            state1: new State1(),
            state2: new State2(),
        });

        const fac1 = new Facade1(store.createRootMountPoint("state1"), "facade1", new Commands1());
        const fac2 = new Facade2(store.createRootMountPoint("state2"), "facade2", new Commands2());
        const view = new View({fac1, fac2});

        let firstCalled = false;
        view
            .select(vs => {
                assert.equal(vs.fac1.value1, 10);
                assert.equal(vs.fac2.value2, 20);
                firstCalled = true;
            })

            .subscribe();

        view
            .select(vs => {
                assert.isTrue(firstCalled);
                assert.equal(vs.fac1.value1, 10);
                assert.equal(vs.fac2.value2, 20);
                done();
            })

            .subscribe();
    });

    it("correctly unsubscribes with 1 observer", function () {
        const store = createTyduxStore({
            state1: new State1(),
            state2: new State2(),
        });

        const fac1 = new Facade1(store.createRootMountPoint("state1"), "facade1", new Commands1());
        const fac2 = new Facade2(store.createRootMountPoint("state2"), "facade2", new Commands2());
        const view = new View({fac1, fac2});
        assert.equal(view.internalSubscriptionCount, 0);

        let sub1 = view
            .select(vs => {
                assert.equal(vs.fac1.value1, 10);
                assert.equal(vs.fac2.value2, 20);
            })

            .subscribe();

        assert.equal(view.internalSubscriptionCount, 2);
        sub1.unsubscribe();
        assert.equal(view.internalSubscriptionCount, 0);
    });

    it("correctly unsubscribes with 2 observers", function () {
        const store = createTyduxStore({
            state1: new State1(),
            state2: new State2(),
        });

        const fac1 = new Facade1(store.createRootMountPoint("state1"), "facade1", new Commands1());
        const fac2 = new Facade2(store.createRootMountPoint("state2"), "facade2", new Commands2());
        const view = new View({fac1, fac2});

        assert.equal(view.internalSubscriptionCount, 0);

        let sub1 = view
            .select(vs => {
                assert.equal(vs.fac1.value1, 10);
                assert.equal(vs.fac2.value2, 20);
            })

            .subscribe();

        let sub2 = view
            .select(vs => {
                assert.equal(vs.fac1.value1, 10);
                assert.equal(vs.fac2.value2, 20);
            })

            .subscribe();

        assert.equal(view.internalSubscriptionCount, 4);
        sub1.unsubscribe();
        assert.equal(view.internalSubscriptionCount, 2);
        sub2.unsubscribe();
        assert.equal(view.internalSubscriptionCount, 0);
    });

});
