import {assert} from "chai";
import {map} from "rxjs/operators";
import {defer} from "./DeferredStateMutators";
import {enableTyduxDevelopmentMode} from "./development";
import {StateMutators} from "./mutators";
import {Store} from "./Store";
import {collect} from "./test-utils";


describe("DeferredStateMutators", function () {

    beforeEach(() => enableTyduxDevelopmentMode());

    it("defer()", function (done) {
        class MyState {
            count = 1;
        }

        class CounterStateGroup extends StateMutators<MyState> {
            setCounter(counter: number) {
                this.state.count = counter;
            }
        }

        const store = Store.create({
            counter1: defer(() => {
                return new Promise<CounterStateGroup>(resolve => {
                    setTimeout(() => {
                        resolve(new CounterStateGroup(new MyState()));
                    }, 0);
                });
            }),
            counter2: new CounterStateGroup(new MyState()),
            child3: {
                child4: new CounterStateGroup(new MyState())
            },
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

        store.mutate.counter2.setCounter(20);
        store.mutate.child3.child4.setCounter(34);
        store.mutate.child1.child2.get().then(m => m.setCounter(12));

        console.log("store.state", store.state);
        console.log("store.state.child3.child4.count", store.state.child3.child4.count);

        setTimeout(() => {

            console.log("store.state.child1.child2!.count", store.state.child1.child2.count);

            done();
        }, 1000);


        // store.mutate.counter1.setCounter(10);
        // assert.equal(store.state.counter1.count, 10);
    });

});
