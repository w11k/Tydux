import {globalStateChanges$} from "./dev-tools";
import {enableTyduxDevelopmentMode} from "./development";
import {Mutators} from "./mutators";
import {Store} from "./Store";

describe("DevTools", function () {

    beforeEach(function () {
        enableTyduxDevelopmentMode();
    });

    it("events contain the store and mutators name", function (done) {
        const eventActionTypes: string[] = [];

        class MyMutators extends Mutators<any> {
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
        	eventActionTypes.push(event.storeName + " # " + event.action.type);
        });

        const store = new MyStore("myStore", new MyMutators(), {});
        setTimeout(() => {
            store.action1();
            store.action1();

            setTimeout(() => {
                store.action2();

                setTimeout(() => {
                    assert.deepEqual(eventActionTypes, [
                        "myStore # @@INIT",
                        "myStore # action1 / mut1",
                        "myStore # action1 / mut2",
                        "myStore # action1 / mut1",
                        "myStore # action1 / mut2",
                        "myStore # action2 / mut1",
                        "myStore # action2 / mut3",
                    ]);
                    done();
                }, 0);
            }, 0);
        }, 0);

    });

});
