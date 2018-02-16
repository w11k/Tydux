import {assert} from "chai";
import {share} from "rxjs/operators";
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

    constructor() {
        super("store2", new Mutators2(), new State2());
    }

    action2() {
        this.mutate.mut2();
    }
}

describe("UnboundedObservable", function () {

    beforeEach(function () {
        enableTyduxDevelopmentMode();
    });

    describe("selectMany()", function () {

        it("will buffer values and call the mapper function asynchronously", function (done) {
            const store1 = new Store1();
            const store2 = new Store2();

            // combine
            selectMany(
                store1.select(s => s.value1),
                store2.select(s => s.value2),
                (v1, v2) => {
                    assert.equal(v1, 1);
                    assert.equal(v2, 2);
                    done();
                })
                .asObservable()
                .subscribe();

            store1.action1();
            store2.action2();
        });

    });
});
