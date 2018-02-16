import {assert} from "chai";
import {enableTyduxDevelopmentMode} from "./development";
import {Mutators} from "./mutators";
import {Store} from "./Store";
import {selectMany} from "./UnboundedObservable";

// Store 1
class State1 {
    value1 = 0;
}

class Mutators1 extends Mutators<State1> {
    mut1() {
        this.state.value1 = 1;
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
    value2 = 0;
    value3 = 0;
    value4 = 0;
    value5 = 0;
    value6 = 0;
}

class Mutators2 extends Mutators<State2> {
    mut2() {
        this.state.value2 = 2;
        this.state.value3 = 20;
        this.state.value4 = 200;
        this.state.value5 = 2000;
        this.state.value6 = 20000;
    }
}

class Store2 extends Store<Mutators2, State2> {

    constructor(private readonly store1: Store1) {
        super("store2", new Mutators2(), new State2());
    }

    action2() {
        this.store1.action1();
        this.mutate.mut2();
    }
}

describe("UnboundedObservable", function () {

    beforeEach(function () {
        enableTyduxDevelopmentMode();
    });

    describe("method", function () {

        it("share()", function () {

            let unsharedCalled = 0;

            let sharedCalled = 0;

            class State1 {
                value1 = 0;
            }

            class Mutators1 extends Mutators<State1> {
                mut1() {
                    this.state.value1 = 1;
                }
            }

            class Store1 extends Store<Mutators1, State1> {

                selectedUnshared = selectMany(
                    this.select(s => s.value1),
                    this.select(s => s.value1),
                    (v1, v2) => {
                        unsharedCalled++;
                        return v1 + "-" + v2;
                    }
                );

                selectedShared = selectMany(
                    this.select(s => s.value1),
                    this.select(s => s.value1),
                    (v1, v2) => {
                        sharedCalled++;
                        return v1 + "-" + v2;
                    }
                ).share();

                action1() {
                    this.mutate.mut1();
                }
            }

            const store = new Store1("store1", new Mutators1(), new State1());

            store.selectedUnshared.unbounded().subscribe();
            store.selectedUnshared.unbounded().subscribe();
            store.selectedShared.unbounded().subscribe();
            store.selectedShared.unbounded().subscribe();

            store.action1();

            assert.equal(unsharedCalled, 6);
            assert.equal(sharedCalled, 3);
        });
    });

    describe("selectMany()", function () {

        it("can combine 2 store.select()", function (done) {
            const store1 = new Store1();
            const store2 = new Store2(store1);

            // combine
            selectMany(
                store1.select(s => s.value1),
                store2.select(s => s.value2),
                (v1, v2) => v1 + "-" + v2)
                .unbounded()
                .subscribe(values => {
                    assert.equal(values, "1-2");
                    done();
                });

            store2.action2();
        });

        it("can combine 3 store.select()", function (done) {
            const store1 = new Store1();
            const store2 = new Store2(store1);

            // combine
            selectMany(
                store1.select(s => s.value1),
                store2.select(s => s.value2),
                store2.select(s => s.value3),
                (v1, v2, v3) => v1 + v2 + v3)
                .unbounded()
                .subscribe(values => {
                    assert.equal(values, 23);
                    done();
                });

            store2.action2();
        });

        it("can combine 4 store.select()", function (done) {
            const store1 = new Store1();
            const store2 = new Store2(store1);

            // combine
            selectMany(
                store1.select(s => s.value1),
                store2.select(s => s.value2),
                store2.select(s => s.value3),
                store2.select(s => s.value4),
                (v1, v2, v3, v4) => v1 + v2 + v3 + v4)
                .unbounded()
                .subscribe(values => {
                    assert.equal(values, 223);
                    done();
                });

            store2.action2();
        });

        it("can combine 5 store.select()", function (done) {
            const store1 = new Store1();
            const store2 = new Store2(store1);

            // combine
            selectMany(
                store1.select(s => s.value1),
                store2.select(s => s.value2),
                store2.select(s => s.value3),
                store2.select(s => s.value4),
                store2.select(s => s.value5),
                (v1, v2, v3, v4, v5) => v1 + v2 + v3 + v4 + v5)
                .unbounded()
                .subscribe(values => {
                    assert.equal(values, 2223);
                    done();
                });

            store2.action2();
        });

        it("can combine 6 store.select()", function (done) {
            const store1 = new Store1();
            const store2 = new Store2(store1);

            // combine
            selectMany(
                store1.select(s => s.value1),
                store2.select(s => s.value2),
                store2.select(s => s.value3),
                store2.select(s => s.value4),
                store2.select(s => s.value5),
                store2.select(s => s.value6),
                (v1, v2, v3, v4, v5, v6) => v1 + v2 + v3 + v4 + v5 + v6)
                .unbounded()
                .subscribe(values => {
                    assert.equal(values, 22223);
                    done();
                });

            store2.action2();
        });

    });
});
