import {assert} from "chai";
import {enableTyduxDevelopmentMode} from "./development";
import {globalStateChanges$, resetTydux} from "./global-state";
import {Mutator} from "./mutator";
import {Store} from "./Store";
import {createAsyncPromise} from "./test-utils";

describe("DevTools", function () {

    beforeEach(() => enableTyduxDevelopmentMode());

    afterEach(() => resetTydux());

    it("events contain the store and mutators name", function (done) {
        const eventActionTypes: string[] = [];

        class MyMutators extends Mutator<any> {
            mut1() {
            }

            mut2() {
            }

            mut3() {
            }
        }

        class MyStore extends Store<MyMutators, any> {
            action1() {
                this.mutate.mut1();
                this.mutate.mut2();
            }

            action2() {
                this.mutate.mut1();
                this.mutate.mut3();
            }
        }

        globalStateChanges$.subscribe((event) => {
            eventActionTypes.push(event.action.type);
        });

        const store = new MyStore("myStore", new MyMutators(), {});
        setTimeout(() => {
            store.action1();
            store.action1();

            setTimeout(() => {
                store.action2();

                setTimeout(() => {
                    assert.deepEqual(eventActionTypes, [
                        "@@INIT",
                        "myStore#action1 / mut1",
                        "myStore#action1 / mut2",
                        "myStore#action1 / mut1",
                        "myStore#action1 / mut2",
                        "myStore#action2 / mut1",
                        "myStore#action2 / mut3",
                    ]);
                    done();
                }, 0);
            }, 0);
        }, 0);

    });

    it("events contain the store and mutators name, support for async methods", function (done) {
        const eventActionTypes: string[] = [];

        class MyMutators extends Mutator<any> {
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
                        "myStore#action1 / mut1",
                        "myStore#innerAction / mut1",
                        "myStore#innerAction / mut2",
                        "myStore#action1 / mut2",
                        "myStore#action1 / mut1",
                        "myStore#innerAction / mut1",
                        "myStore#innerAction / mut2",
                        "myStore#action1 / mut2",
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
    });


});
