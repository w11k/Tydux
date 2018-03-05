import {enableTyduxDevelopmentMode} from "./development";
import {EntityStore} from "./Entity.store";

class MyEnt {
    id?: string;
    fieldA?: number;
}

describe("EntityStore", function () {

    beforeEach(function () {
        enableTyduxDevelopmentMode();
    });

    it("todo", function () {
        let entityStore = new EntityStore<MyEnt>("es1", "id");
    });

});
