import {assert} from "chai";
import {enableTyduxDevelopmentMode} from "./development";
import {globalStateChanges$} from "./global-state";
import {Commands} from "./commands";
import {ProcessedAction, Fassade} from "./Fassade";
import {afterAllStoreEvents} from "./test-utils";


describe("global state", function () {

    beforeEach(function () {
        enableTyduxDevelopmentMode();
    });

    it("collects MutatorEvents", async function () {
        const events: ProcessedAction<any>[] = [];

        class MyMutators extends Commands<{ count: number }> {
            mut1() {
                this.state.count = 1;
            }

            mut2(count: number) {
                this.state.count = count;
            }
        }

        class MyStore extends Fassade<MyMutators, { count: number }> {
            action1() {
                this.commands.mut1();
                this.commands.mut2(2);
            }
        }

        globalStateChanges$.subscribe((event) => {
            events.push(event);
        });

        const store = new MyStore("store", new MyMutators(), {count: 0});
        store.action1();

        await afterAllStoreEvents(store);

        assert.equal(events[0].mutatorAction.type, "@@INIT");
        assert.equal(events[1].mutatorAction.type, "mut1");
        assert.equal(events[2].mutatorAction.type, "mut2");
        assert.deepEqual(events[2].mutatorAction.payload, [2]);
    });

    it("replay MutatorEvents", function () {
        class MyMutators extends Commands<{ count: number }> {
            mut(count: number) {
                this.state.count = count;
            }
        }

        class MyStore extends Fassade<MyMutators, { count: number }> {
        }

        const store = new MyStore("myStore", new MyMutators(), {count: 0});


    });


});
