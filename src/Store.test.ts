import {assert} from "chai";
import {map} from "rxjs/operators";
import {enableTyduxDevelopmentMode} from "./development";
import {Mutator} from "./mutators";
import {Store} from "./Store";
import {collect} from "./test-utils";


describe("Store", function () {

    beforeEach(() => enableTyduxDevelopmentMode());

    it("Mutators can change the state", function () {
        class MyState {
            count = 1;
        }

        class CounterStateGroup extends Mutator<MyState> {
            setCounter(counter: number) {
                this.state.count = counter;
            }
        }

        const store = Store.create({
            counter1: new CounterStateGroup(new MyState()),
        });

        store.mutate.counter1.setCounter(10);
        assert.equal(store.state.counter1.count, 10);
    });


    it("Mutators can be structured", function () {
        class MyState {
            count = 0;
        }

        class CounterStateGroup extends Mutator<MyState> {
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

        class CounterStateGroup extends Mutator<MyState> {
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

        store.mutate.counter1.setCounter(10);
        store.mutate.child1.child2.child3.counter2.setCounter(20);
        assert.equal(store.state.counter1.count, 10);
        assert.equal(store.state.child1.child2.child3.counter2.count, 20);

        view.mutate.child3.counter2.setCounter(30);
        assert.equal(store.state.counter1.count, 10);
        assert.equal(store.state.child1.child2.child3.counter2.count, 30);
        assert.equal(view.state.child3.counter2.count, 30);
    });

    it("getView() - the returned Store filters changeEvents based on the view path", function () {
        class MyState {
            count = 0;
        }

        class CounterStateGroup extends Mutator<MyState> {
            setCounter(counter: number) {
                this.state.count = counter;
            }
        }

        const store = Store.create({
            counter1: new CounterStateGroup(new MyState()),
            child1: {
                counter2: new CounterStateGroup(new MyState())
            }
        });

        let view = store.getView(s => s.child1);
        let viewStateChanges = collect(view.stateChanges.pipe(
            map(event => event.state)
        ));

        store.mutate.counter1.setCounter(10);
        store.mutate.counter1.setCounter(20);
        view.mutate.counter2.setCounter(100);
        view.mutate.counter2.setCounter(200);

        viewStateChanges.assert(
            {counter2: {count: 100}},
            {counter2: {count: 200}}
        );
    });

});
