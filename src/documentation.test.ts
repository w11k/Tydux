import {assert} from "chai";
import {enableTyduxDevelopmentMode} from "./development";
import {StateMutators} from "./mutators";
import {Store} from "./Store";


describe("Documentation", function () {

    beforeEach(() => enableTyduxDevelopmentMode());


    it("overview", function () {
        // collect output
        const output: string[] = [];
        const log = (...msgs: any[]) => output.push(msgs.join(" "));

        const state = {
            count: 0
        };

        class CounterStateGroup extends StateMutators<typeof state> {
            increment() {
                this.state.count++;
            }

            decrement() {
                this.state.count--;
            }
        }

        const rootStateGroup = {
            counter: new CounterStateGroup(state)
        };

        const store = Store.create(rootStateGroup);

        // directly query the state
        log("snapshot1", store.state.counter.count);
        store.mutate.counter.increment();
        log("snapshot2", store.state.counter.count);

        // observe the state
        store.unbounded().select(s => s.counter.count)
            .subscribe(count => {
                log("observe", count);
            });

        // dispatch actions
        store.mutate.counter.increment();
        store.mutate.counter.increment();
        store.mutate.counter.decrement();

        assert.deepEqual(output, [
            "snapshot1 0",
            "snapshot2 1",
            "observe 1",
            "observe 2",
            "observe 3",
            "observe 2"
        ]);
    });

});
