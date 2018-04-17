import {defer} from "./DeferredMutator";
import {enableTyduxDevelopmentMode} from "./development";
import {Mutator} from "./mutators";
import {Store} from "./Store";
import {assert} from "chai";


describe("DeferredStateMutators", function () {

    beforeEach(() => enableTyduxDevelopmentMode());

    it("defer()", function (done) {
        class MyState {
            count = 1;
        }

        class CounterStateGroup extends Mutator<MyState> {
            setCounter(counter: number) {
                this.state.count = counter;
            }
        }

        const store = Store.create({
            child1: {
                child2: defer<CounterStateGroup>(() => {
                    return new Promise<CounterStateGroup>(resolve => {
                        setTimeout(() => {
                            resolve(new CounterStateGroup(new MyState()));
                        }, 0);
                    });
                })
            },
        });

        store.mutate.child1.child2.get().then(m => m.setCounter(12));

        store.mutate.child1.child2.resolve().then(() => {
            assert.equal(store.state.child1.child2.count.toExponential(), "12");
            done();
        });
    });

});
