import {EntityStoreFacade} from "./Entity.store";
import {createTyduxStore} from "./store";

class Person {
    constructor(readonly id: number, readonly name: string) {
    }
}

describe("EntityStoreFacade", () => {

    it("state fields are null initially", () => {
        const tydux = createTyduxStore();
        const esf = new EntityStoreFacade<Person>(tydux.createMountPoint("persons"), "id");
        expect(esf.state.list).toBeNull();
        expect(esf.state.byId).toBeNull();
    });

    it("isPristine() at start", () => {
        const tydux = createTyduxStore();
        const esf = new EntityStoreFacade<Person>(tydux.createMountPoint("persons"), "id");
        expect(esf.isPristine).toBeTruthy();
    });

    it("is not pristine once an entity was added", () => {
        const tydux = createTyduxStore();
        const esf = new EntityStoreFacade<Person>(tydux.createMountPoint("persons"), "id");
        const p0 = new Person(0, "Joe");
        esf.add(p0);
        expect(esf.isPristine()).toBeFalsy();
    });

    it("is pristine after reset()", () => {
        const tydux = createTyduxStore();
        const esf = new EntityStoreFacade<Person>(tydux.createMountPoint("persons"), "id");
        const p0 = new Person(0, "Joe");
        esf.add(p0);
        expect(esf.isPristine()).toBeFalsy();
        esf.reset();
        expect(esf.isPristine()).toBeTruthy();
    });

    it("add entry with idSelector function", () => {
        const tydux = createTyduxStore();
        const esf = new EntityStoreFacade<Person>(
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
        const esf = new EntityStoreFacade<Person>(
            tydux.createMountPoint("persons"),
            "id"
        );
        const p0 = new Person(0, "Joe");
        esf.add(p0);
        expect(esf.state.list).toEqual([p0]);
        expect(esf.state.byId).toEqual({0: p0});
    });




});
