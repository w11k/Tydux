import {assert} from "chai";
import {enableTyduxDevelopmentMode} from "./development";
import {EntityStore} from "./Entity.store";
import {resetTydux} from "./global-state";

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

    it("instances can be subscribed by id", function () {
        let es = new EntityStore("es1", MyEnt, "id");

        // TODO

        es.add(new MyEnt(1, "a"));
        const entity = es.state.entities["1"];
        assert.equal(entity.id, 1);
        assert.equal(entity.fieldA, "a");
    });

});
