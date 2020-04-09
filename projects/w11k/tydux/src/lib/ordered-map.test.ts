import {orderedMapAdd, orderedMapIsPristine, orderedMapReset, orderedMapSetList, OrderedMapState} from "./ordered-map";

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

    // it("append list filters duplicates", () => {
    //     let om = new OrderedMapState<Person>("id");
    //     const list1 = [
    //         new Person(0, "Joe"),
    //         new Person(1, "John"),
    //         new Person(2, "Jonnie"),
    //     ];
    //     const list2 = [
    //         new Person(0, "Joe2"),
    //         new Person(1, "John2"),
    //     ];
    //     om = orderedMapSetList(om, list1);
    //     om = orderedMapAppendList(om, list2);
    //
    //     expect(om.list).toEqual([
    //         new Person(2, "Jonnie"),
    //         new Person(0, "Joe2"),
    //         new Person(1, "John2"),
    //     ]);
    //     expect(om.byId).toEqual({
    //         0: list2[0],
    //         1: list2[1],
    //         2: list2[2],
    //     });
    // });

});
