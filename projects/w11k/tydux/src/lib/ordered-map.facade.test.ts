import {OrderedMapFacade} from "./ordered-map.facade";
import {createTyduxStore} from "./store";

class Person {
    constructor(readonly id: number, readonly name: string) {
    }
}

describe("OrderedMapFacade", () => {

    it("state fields are null initially", () => {
        const tydux = createTyduxStore();
        const esf = new OrderedMapFacade<Person>(tydux.createMountPoint("persons"), "id");
        expect(esf.state.list).toBeNull();
        expect(esf.state.byId).toBeNull();
    });

    it("isPristine() at start", () => {
        const tydux = createTyduxStore();
        const esf = new OrderedMapFacade<Person>(tydux.createMountPoint("persons"), "id");
        expect(esf.isPristine).toBeTruthy();
    });

    it("is not pristine once an entity was added", () => {
        const tydux = createTyduxStore();
        const esf = new OrderedMapFacade<Person>(tydux.createMountPoint("persons"), "id");
        const p0 = new Person(0, "Joe");
        esf.add(p0);
        expect(esf.isPristine()).toBeFalsy();
    });

    it("is pristine after reset()", () => {
        const tydux = createTyduxStore();
        const esf = new OrderedMapFacade<Person>(tydux.createMountPoint("persons"), "id");
        const p0 = new Person(0, "Joe");
        esf.add(p0);
        expect(esf.isPristine()).toBeFalsy();
        esf.reset();
        expect(esf.isPristine()).toBeTruthy();
    });

    it("add entry with idSelector function", () => {
        const tydux = createTyduxStore();
        const esf = new OrderedMapFacade<Person>(
            tydux.createMountPoint("persons"),
            e => e.id
        );
        const p0 = new Person(0, "Joe");
        esf.add(p0);
        expect(esf.state.list).toEqual([p0]);
        expect(esf.state.byId).toEqual({0: p0});
    });

    it("add entry with idSelector field", () => {
        const tydux = createTyduxStore();
        const esf = new OrderedMapFacade<Person>(
            tydux.createMountPoint("persons"),
            "id"
        );
        const p0 = new Person(0, "Joe");
        esf.add(p0);
        expect(esf.state.list).toEqual([p0]);
        expect(esf.state.byId).toEqual({0: p0});
    });

    it("add list", () => {
        const tydux = createTyduxStore();
        const esf = new OrderedMapFacade<Person>(
            tydux.createMountPoint("persons"),
            "id"
        );
        const list = [
            new Person(0, "Joe"),
            new Person(1, "John"),
            new Person(2, "Jonnie"),
        ];
        esf.addList(list);
        expect(esf.state.list).toEqual(list);
        expect(esf.state.byId).toEqual({
            0: list[0],
            1: list[1],
            2: list[2],
        });
    });

    it("setList() replaces the state", () => {
        const tydux = createTyduxStore();
        const esf = new OrderedMapFacade<Person>(
            tydux.createMountPoint("persons"),
            "id"
        );
        const list1 = [
            new Person(0, "Joe"),
            new Person(1, "John"),
        ];
        esf.addList(list1);

        const list2 = [
            new Person(2, "Jonnie"),
        ];
        esf.setList(list2);
        expect(esf.state.list).toEqual(list2);
        expect(esf.state.byId).toEqual({
            2: list2[0],
        });
    });

});
