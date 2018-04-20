import {assert} from "chai";
import {enableTyduxDevelopmentMode} from "./development";
import {resetTydux} from "./global-state";
import {Mutators} from "./mutators";
import {Store} from "./Store";
import {collect} from "./test-utils";
import {createView} from "./view";

// Store 1
class State1 {
    value1 = 10;
}

class Mutators1 extends Mutators<State1> {
    mut1() {
        this.state.value1++;
    }
}

class Store1 extends Store<Mutators1, State1> {

    constructor() {
        super("store1", new Mutators1(), new State1());
    }

    action1() {
        this.mutate.mut1();
    }
}

// Store 2
class State2 {
    value2 = 20;
}

class Mutators2 extends Mutators<State2> {
    mut2() {
        this.state.value2++;
    }
}

class Store2 extends Store<Mutators2, State2> {

    constructor() {
        super("store2", new Mutators2(), new State2());
    }

    action2() {
        this.mutate.mut2();
    }
}

describe("View", function () {

    beforeEach(function () {
        enableTyduxDevelopmentMode();
    });

    afterEach(() => resetTydux());

    it("creates a combined state", function () {
        const store1 = new Store1();
        const store2 = new Store2();

        store1.action1();
        store2.action2();

        const view = createView({
            store1,
            store2,
            child1: {
                child2: {
                    store1,
                    store2
                }
            }
        });

        assert.equal(view.state.store1.value1, 11);
        assert.equal(view.state.store2.value2, 21);
        assert.equal(view.state.child1.child2.store1.value1, 11);
        assert.equal(view.state.child1.child2.store2.value2, 21);
    });

    it("StateObserver starts with the current values", function () {
        const store1 = new Store1();
        const store2 = new Store2();

        store1.action1();
        store2.action2();

        const view = createView({
            store1,
            child1: {
                child2: {
                    store1
                }
            }
        });

        let collected = collect(view.unbounded().select());

        collected.assert(
            {store1: {value1: 11}, child1: {child2: {store1: {value1: 11}}}}
        );
    });

    it("StateObserver emits changes", function () {
        const store1 = new Store1();
        const store2 = new Store2();

        store1.action1();
        store2.action2();

        const view = createView({
            child1: {
                child2: {
                    store1,
                    store2
                }
            }
        });

        let collected = collect(view.unbounded().select());

        store1.action1();
        store1.action1();
        store2.action2();

        collected.assert(
            {child1: {child2: {store1: {value1: 11}, store2: {value2: 21}}}},
            {child1: {child2: {store1: {value1: 12}, store2: {value2: 21}}}},
            {child1: {child2: {store1: {value1: 13}, store2: {value2: 21}}}},
            {child1: {child2: {store1: {value1: 13}, store2: {value2: 22}}}},
        );
    });

    it("StateObserver always freezes the state", function (done) {
        const store1 = new Store1();
        store1.action1();
        const view = createView({
            child1: {
                child2: {
                    store1
                }
            }
        });

        view.unbounded().select().subscribe(s => {
            assert.throws(() => {
                (s.child1 as any)["a"] = "a";
            });
            assert.throws(() => {
                s.child1.child2.store1.value1 = 10;
            });
            done();
        });
    });

});
