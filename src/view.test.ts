/*
import {assert} from "chai";
import {Commands} from "./commands";
import {enableTyduxDevelopmentMode} from "./development";
import {Facade} from "./Facade";
import {createTyduxStore} from "./store";
import {collect, untilNoBufferedStateChanges} from "./test-utils";
import {View} from "./view";

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
    createCommands(): Commands1 {
        return new Commands1();
    }

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
    createCommands(): Commands2 {
        return new Commands2();
    }

    action2() {
        this.commands.mut2();
    }
}

describe("View", function () {

    // beforeEach(function () {
    //     enableTyduxDevelopmentMode();
    // });

    it("StateObserver starts with the current values", async function () {
        const store = createTyduxStore({
            state1: new State1(),
            state2: new State2(),
        });

        const store1 = new Facade1(store.createRootMountPoint("state1"));
        const store2 = new Facade2(store.createRootMountPoint("state2"));

        store1.action1();
        await untilNoBufferedStateChanges(store1);

        store2.action2();
        await untilNoBufferedStateChanges(store2);

        const view = new View({
            store1,
            child1: {
                child2: {
                    store1
                }
            }
        });

        view.select(s => ({
            v1: s.store1.value1,
            v2: s.child1.child2.store1.value1
        }));

        let collected = collect(view.select().unbounded());
        collected.assert(
            {store1: {value1: 11}, child1: {child2: {store1: {value1: 11}}}}
        );
    });

    it("StateObserver emits changes", async function () {
        const store1 = new Facade1();
        const store2 = new Facade2();

        store1.action1();
        await untilNoBufferedStateChanges(store1);

        store2.action2();
        await untilNoBufferedStateChanges(store2);

        const view = new View({
            child1: {
                child2: {
                    store1,
                    store2
                }
            }
        });

        let collected = collect(view.select().unbounded());

        store1.action1();
        store1.action1();
        store2.action2();

        await untilNoBufferedStateChanges(store1);
        await untilNoBufferedStateChanges(store2);

        collected.assert(
            {child1: {child2: {store1: {value1: 11}, store2: {value2: 21}}}},
            {child1: {child2: {store1: {value1: 12}, store2: {value2: 21}}}},
            {child1: {child2: {store1: {value1: 13}, store2: {value2: 21}}}},
            {child1: {child2: {store1: {value1: 13}, store2: {value2: 22}}}},
        );
    });

    it("StateObserver always freezes the state", async function () {
        const store1 = new Facade1();
        store1.action1();
        await untilNoBufferedStateChanges(store1);

        const view = new View({
            child1: {
                child2: {
                    store1
                }
            }
        });

        let called = false;
        view.select().unbounded().subscribe(s => {
            console.log(1);
            assert.throws(() => {
                (s.child1 as any)["a"] = "a";
            });
            assert.throws(() => {
                s.child1.child2.store1.value1 = 10;
            });
            called = true;
        });
        assert.isTrue(called);
    });

    it("StateObserver#select() maps the event stream", async function () {
        const store1 = new Facade1();
        const store2 = new Facade2();

        const view = new View({store1, store2});

        const values: any[] = [];
        view
            .select(s => {
                return {
                    v1: s.store1.value1,
                    v2: s.store2.value2
                };
            })
            .unbounded()
            .subscribe(v => {
                values.push([v.v1, v.v2]);
            });

        store1.action1();
        store2.action2();

        await untilNoBufferedStateChanges(store1);
        await untilNoBufferedStateChanges(store2);

        assert.deepEqual(values, [
            [10, 20],
            [11, 20],
            [11, 21],
        ]);
    });

    it("StateObserver#select() filters the event stream", async function () {
        const store1 = new Facade1();
        const store2 = new Facade2();

        const view = new View({store1, store2});

        const values: any[] = [];
        view
            .select(s => {
                return {
                    v1: s.store1.value1
                };
            })
            .unbounded()
            .subscribe(v => {
                values.push([v.v1]);
            });

        store2.action2();

        await untilNoBufferedStateChanges(store1);
        await untilNoBufferedStateChanges(store2);

        assert.deepEqual(values, [
            [10],
        ]);
    });

    it("StateObserver#select() directly provides the structure to select from (1 observer)", function (done) {
        const store1 = new Facade1();
        const store2 = new Facade2();

        const view = new View({store1, store2});
        view
            .select(vs => {
                assert.equal(vs.store1.value1, 10);
                assert.equal(vs.store2.value2, 20);
                done();
            })
            .unbounded()
            .subscribe();
    });

    it("StateObserver#select() directly provides the structure to select from (2 observers)", function (done) {
        const store1 = new Facade1();
        const store2 = new Facade2();

        const view = new View({store1, store2});

        view
            .select(vs => {
                assert.equal(vs.store1.value1, 10);
                assert.equal(vs.store2.value2, 20);
            })
            .unbounded()
            .subscribe();

        view
            .select(vs => {
                assert.equal(vs.store1.value1, 10);
                assert.equal(vs.store2.value2, 20);
                done();
            })
            .unbounded()
            .subscribe();
    });

    it("correctly unsubscribes with 1 observer", function () {
        const store1 = new Facade1();
        const store2 = new Facade2();

        const view = new View({store1, store2});

        assert.equal(view.internalSubscriptionCount, 0);

        let sub1 = view
            .select(vs => {
                assert.equal(vs.store1.value1, 10);
                assert.equal(vs.store2.value2, 20);
            })
            .unbounded()
            .subscribe();

        assert.equal(view.internalSubscriptionCount, 2);
        sub1.unsubscribe();
        assert.equal(view.internalSubscriptionCount, 0);
    });

    it("correctly unsubscribes with 2 observers", function () {
        const store1 = new Facade1();
        const store2 = new Facade2();

        const view = new View({store1, store2});

        assert.equal(view.internalSubscriptionCount, 0);

        let sub1 = view
            .select(vs => {
                assert.equal(vs.store1.value1, 10);
                assert.equal(vs.store2.value2, 20);
            })
            .unbounded()
            .subscribe();

        let sub2 = view
            .select(vs => {
                assert.equal(vs.store1.value1, 10);
                assert.equal(vs.store2.value2, 20);
            })
            .unbounded()
            .subscribe();

        assert.equal(view.internalSubscriptionCount, 4);
        sub1.unsubscribe();
        assert.equal(view.internalSubscriptionCount, 2);
        sub2.unsubscribe();
        assert.equal(view.internalSubscriptionCount, 0);
    });

});
*/
