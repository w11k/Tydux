import {assert} from "chai";
import {enableTyduxDevelopmentMode} from "./development";
import {StateMutators, Store} from "./Store";

describe("DevTools", function () {

    beforeEach(() => enableTyduxDevelopmentMode());

    it("events contain the store and mutators name", function (done) {
        const eventActionTypes: string[] = [];

        class MyState {
            count = 0;
        }

        class CounterStateGroup extends StateMutators<MyState> {
            increment() {
                this.state.count++;
            }

            decrement() {
                this.state.count--;
            }
        }

        const rootStateGroup = {
            counter: new CounterStateGroup(new MyState())
        };

        const store = Store.create(rootStateGroup);


        store.stateChanges.subscribe((event) => {
            eventActionTypes.push(event.action.type);
        });

        setTimeout(() => {
            store.mutate.counter.increment();
            store.mutate.counter.increment();

            setTimeout(() => {
                store.mutate.counter.decrement();

                setTimeout(() => {
                    assert.deepEqual(eventActionTypes, [
                        "@@INIT",
                        "counter.increment",
                        "counter.increment",
                        "counter.decrement",
                    ]);
                    done();
                }, 0);
            }, 0);
        }, 0);

    });

    /*    it("events contain the store and mutators name, support for async methods", function (done) {
            const eventActionTypes: string[] = [];

            class MyMutators extends Mutators<any> {
                mut1() {
                }

                mut2() {
                }
            }

            class MyStore extends Store<MyMutators, any> {

                async action1() {
                    this.mutate.mut1();
                    this.innerAction();
                    this.mutate.mut2();
                    await createAsyncPromise(10);
                    this.mutate.mut1();
                    this.innerAction();
                    this.mutate.mut2();

                    setTimeout(() => {
                        assert.deepEqual(eventActionTypes, [
                            "@@INIT",
                            "mut1",
                            "mut1",
                            "mut2",
                            "mut2",
                            "mut1",
                            "mut1",
                            "mut2",
                            "mut2",
                        ]);
                        done();
                    }, 0);
                }

                private innerAction() {
                    this.mutate.mut1();
                    this.mutate.mut2();
                }
            }

            globalStateChanges$.subscribe((event) => {
                eventActionTypes.push(event.action.type);
            });

            const store = new MyStore("myStore", new MyMutators(), {});
            store.action1();
        });*/


});
