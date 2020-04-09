import {
    orderedMapAdd,
    orderedMapIsPristine,
    orderedMapPatchEntities,
    orderedMapReset,
    orderedMapSetList,
    OrderedMapState
} from "./ordered-map";

class Person {
    constructor(readonly id: number, readonly name: string) {
    }
}

describe("OrderedMapFacade", () => {

    it("isPristine() at start", () => {
        const om = new OrderedMapState<Person>("id");
        expect(orderedMapIsPristine(om)).toBeTruthy();
    });

    it("is not pristine once an entity was added", () => {
        let om = new OrderedMapState<Person>("id");
        const p0 = new Person(0, "Joe");
        om = orderedMapAdd(om, p0);
        expect(orderedMapIsPristine(om)).toBeFalsy();
    });

    it("is pristine after reset()", () => {
        let om = new OrderedMapState<Person>("id");
        const p0 = new Person(0, "Joe");
        om = orderedMapAdd(om, p0);
        expect(orderedMapIsPristine(om)).toBeFalsy();
        om = orderedMapReset(om);
        expect(orderedMapIsPristine(om)).toBeTruthy();
    });

    it("add entry with idSelector field", () => {
        let om = new OrderedMapState<Person>("id");
        const p0 = new Person(0, "Joe");
        om = orderedMapAdd(om, p0);
        expect(om.list).toEqual([p0]);
        expect(om.byId).toEqual({0: [0, p0]});
    });

    it("set list", () => {
        let om = new OrderedMapState<Person>("id");
        const list = [
            new Person(0, "Joe"),
            new Person(1, "John"),
            new Person(2, "Jonnie"),
        ];
        om = orderedMapSetList(om, list);
        expect(om.list).toEqual(list);
        expect(om.byId).toEqual({
            0: [0, list[0]],
            1: [1, list[1]],
            2: [2, list[2]],
        });
    });

    it("patch entities", () => {
        let om = new OrderedMapState<Person>("id");
        const list1 = [
            new Person(0, "Joe"),
            new Person(1, "John"),
            new Person(2, "Jonnie"),
        ];

        om = orderedMapSetList(om, list1);
        om = orderedMapPatchEntities(om, {
            0: new Person(0, "Joe2"),
            1: new Person(1, "John2"),
        });

        expect(om.list).toEqual([
            new Person(0, "Joe2"),
            new Person(1, "John2"),
            new Person(2, "Jonnie"),
        ]);
        expect(om.byId).toEqual({
            0: [0, new Person(0, "Joe2")],
            1: [1, new Person(1, "John2")],
            2: [2, new Person(2, "Jonnie")],
        });
    });

});
