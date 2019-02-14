describe("empty test", () => {

});
/*
import {assert} from "chai";
import {enableTyduxDevelopmentMode} from "./development";
import {EntityStore} from "./Entity.store";
import {resetTydux} from "./global-state";
import {afterAllStoreEvents, collect} from "./test-utils";

class MyEnt {
    constructor(readonly id: number, public fieldA: string) {
    }
}

describe("EntityStore", function () {

    beforeEach(() => enableTyduxDevelopmentMode());

    afterEach(() => resetTydux());

    it("instances can be added with `add`", function () {
        let es = new EntityStore("es1", MyEnt, "id");

        es.add(new MyEnt(1, "a"));
        const entity = es.state.entities["1"];
        assert.equal(entity.id, 1);
        assert.equal(entity.fieldA, "a");
    });

    it("selectById()", async function () {
        let es = new EntityStore("es1", MyEnt, "id");
        es.add(new MyEnt(1, "a"));

        await afterAllStoreEvents(es);

        let changes = collect(es.selectById("1"));

        changes.assert(
            new MyEnt(1, "a")
        );
    });

    it("selectById() emits undefined until ID exists", async function () {
        let es = new EntityStore("es1", MyEnt, "id");
        let changes = collect(es.selectById("1"));
        es.add(new MyEnt(1, "a"));

        await afterAllStoreEvents(es);

        changes.assert(
            undefined,
            new MyEnt(1, "a")
        );
    });

    it("selectAll()", async function () {
        let es = new EntityStore("es1", MyEnt, "id");
        let changes = collect(es.selectAll());

        es.add(new MyEnt(1, "a"));
        es.add(new MyEnt(2, "b"));
        es.add(new MyEnt(3, "c"));

        await afterAllStoreEvents(es);

        changes.assert(
            [],
            [new MyEnt(1, "a")],
            [new MyEnt(1, "a"), new MyEnt(2, "b")],
            [new MyEnt(1, "a"), new MyEnt(2, "b"), new MyEnt(3, "c")]
        );
    });

});
*/
