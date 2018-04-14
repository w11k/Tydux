import {assert} from "chai";
import {enableTyduxDevelopmentMode} from "./development";
import {StateMutators, Store} from "./Store";


describe("Store", function () {

    beforeEach(() => enableTyduxDevelopmentMode());

    it("Mutators can be structured", function () {
        class MyState {
            count = 0;
        }

        class CounterStateGroup extends StateMutators<MyState> {
            setCounter(counter: number) {
                this.state.count = counter;
            }
        }

        const store = Store.create({
            counter1: new CounterStateGroup(new MyState()),
            child1: {
                child2: {
                    child3: {
                        counter2: new CounterStateGroup(new MyState())
                    }
                }
            }
        });

        store.mutate.counter1.setCounter(10);
        store.mutate.child1.child2.child3.counter2.setCounter(20);
        assert.equal(store.state.counter1.count, 10);
        assert.equal(store.state.child1.child2.child3.counter2.count, 20);
    });

    it("getView()", function () {
        class MyState {
            count = 0;
        }

        class CounterStateGroup extends StateMutators<MyState> {
            setCounter(counter: number) {
                this.state.count = counter;
            }
        }

        const store = Store.create({
            counter1: new CounterStateGroup(new MyState()),
            child1: {
                child2: {
                    child3: {
                        counter2: new CounterStateGroup(new MyState())
                    }
                }
            }
        });

        let view = store.getView(s => s.child1.child2);

        // store.mutate.counter1.setCounter(10);
        // store.mutate.child1.child2.child3.counter2.setCounter(20);
        // assert.equal(store.state.counter1.count, 10);
        // assert.equal(store.state.child1.child2.child3.counter2.count, 20);

        // view.mutate.child3.counter2.setCounter(30);
        // assert.equal(store.state.counter1.count, 10);
        // assert.equal(store.state.child1.child2.child3.counter2.count, 30);
        // assert.equal(view.state.child3.counter2.count, 30);

        console.log("store.state", JSON.stringify(store.state));
    });

});
