import {assert} from "chai";
import {enableTyduxDevelopmentMode} from "./development";
import {globalStateChanges$, MutatorEvent} from "./global-state";
import {Mutators} from "./mutators";
import {Store} from "./Store";


describe("global state", function () {

    beforeEach(function () {
        enableTyduxDevelopmentMode();
    });

    it("collects MutatorEvents", function () {
        const events: MutatorEvent[] = [];

        class MyMutators extends Mutators<{ count: number }> {
            mut1() {
                this.state.count = 1;
            }

            mut2(count: number) {
                this.state.count = count;
            }
        }

        class MyStore extends Store<MyMutators, { count: number }> {
            action1() {
                this.mutate.mut1();
                this.mutate.mut2(2);
            }
        }

        globalStateChanges$.subscribe((event) => {
            events.push(event);
        });

        const store = new MyStore("store", new MyMutators(), {count: 0});
        store.action1();

        assert.equal(events[0].action.type, "store # @@INIT");

        assert.equal(events[1].action.type, "store # action1 / mut1");

        assert.equal(events[2].action.type, "store # action1 / mut2");
        assert.equal(events[2].action["[0] count"], 2);
    });

    it("replay MutatorEvents", function () {
        class MyMutators extends Mutators<{ count: number }> {
            mut(count: number) {
                this.state.count = count;
            }
        }

        class MyStore extends Store<MyMutators, { count: number }> {
        }

        const store = new MyStore("myStore", new MyMutators(), {count: 0});


    });


});
