import {enableTyduxDevelopmentMode} from "./development";
import {Mutators} from "./mutators";
import {Store} from "./Store";
import {createView} from "./view";

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
}

class Mutators2 extends Mutators<State2> {
    mut2() {
        this.state.value2 = 2;
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

describe("createView()", function () {

    beforeEach(function () {
        enableTyduxDevelopmentMode();
    });

    it("TBD", function (done) {
        const store1 = new Store1();
        const store2 = new Store2();

        let view = createView({
            store1,
            store2,
            child1: {
                child2: {
                    store1,
                    store2
                }
            }
        });

        view.state.store1.value1.toFixed();
        view.state.child1.child2.store1.value1.toExponential();

        // view.unbounded().select()
        //     .subscribe((s) => {
        //         s.child1.child2.store1.value1.toPrecision();
        //     });

    });

});
