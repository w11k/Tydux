import {assert} from "chai";
import {defer} from "./DeferredMutator";
import {enableTyduxDevelopmentMode} from "./development";
import {Mutator} from "./mutators";
import {Store} from "./Store";


describe("DeferredMutator", function () {

    beforeEach(() => enableTyduxDevelopmentMode());

    it("defer() starts with an undefined state", function () {
        class CounterMutator extends Mutator<{ count: number }> {
        }

        const store = Store.create({
            child1: {
                child2: defer(() => {
                    return new Promise<CounterMutator>(resolve => {
                        setTimeout(() => {
                            resolve(new CounterMutator({count: 1}));
                        }, 0);
                    });
                })
            },
        });

        assert.isUndefined(store.state.child1.child2);
    });

    it("can be used after resolve()", function (done) {
        class CounterMutator extends Mutator<{ count: number }> {
            setCounter(counter: number) {
                this.state.count = counter;
            }
        }

        const store = Store.create({
            child1: {
                child2: defer(() => {
                    return new Promise<CounterMutator>(resolve => {
                        setTimeout(() => {
                            resolve(new CounterMutator({count: 1}));
                        }, 0);
                    });
                })
            },
        });

        store.mutate.child1.child2.get().then(m => m.setCounter(12));

        store.mutate.child1.child2.resolve().then(() => {
            assert.equal(store.state.child1.child2!.count.toString(), "12");
            done();
        });
    });

    it("Store#getView(deferredMutator)", function (done) {
        class CounterMutator extends Mutator<{ count: number }> {
            setCounter(counter: number) {
                this.state.count = counter;
            }
        }

        const store = Store.create({
            counter: defer(() => {
                return new Promise<CounterMutator>(resolve => {
                    setTimeout(() => {
                        resolve(new CounterMutator({count: 1}));
                    }, 0);
                });
            })
        });

        let view = store.getView(s => s.counter);
        view.mutate.resolve().then(m => {
            m.setCounter(10);
            // console.log("view.state", view.state);
            done();
        });
    });

});
