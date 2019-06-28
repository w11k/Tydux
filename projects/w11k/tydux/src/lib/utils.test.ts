import {functionNamesDeep} from "./utils";

class TestClass {
    counter = 0;

    increment() {
        this.counter = this.counter + 1;
    }

    decrement() {
        this.counter = this.counter - 1;
    }
}

describe("Utils", () => {
    describe("functionNamesDeep", () => {
        it("should contain 'increment' and 'decrement' for TestClass", () => {
            const result = functionNamesDeep(new TestClass());
            expect(result.length).toEqual(2);
            expect(result.includes("increment"));
            expect(result.includes("decrement"));
        });
    });
});
