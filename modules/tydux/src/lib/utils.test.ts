import {functionNamesDeep, getDeep, setDeep} from "./utils";

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
    it("functionNamesDeep should contain 'increment' and 'decrement' for TestClass", () => {
        const result = functionNamesDeep(new TestClass());
        expect(result.length).toEqual(2);
        expect(result.includes("increment"));
        expect(result.includes("decrement"));
    });

    it("getDeep", () => {
        const root = {
            a: 0,
            foo: {
                b: 1,
                bar: {
                    c: 2,
                }
            }
        };

        expect(getDeep(root, "a")).toEqual(0);
        expect(getDeep(root, "foo.b")).toEqual(1);
        expect(getDeep(root, "foo.bar.c")).toEqual(2);
    });

    describe("setDeep", () => {
        it("1 level", () => {
            let root = {
                a: 0,
                foo: {
                    b: 1,
                    bar: {
                        c: 2,
                    }
                }
            };

            root = setDeep(root, "a", 999);
            expect(root).toEqual({
                a: 999,
                foo: {
                    b: 1,
                    bar: {
                        c: 2,
                    }
                }
            });
        });

        it("2 level", () => {
            let root = {
                a: 0,
                foo: {
                    b: 1,
                    bar: {
                        c: 2,
                    }
                }
            };
            root = setDeep(root, "foo.b", 999);
            expect(root).toEqual({
                a: 0,
                foo: {
                    b: 999,
                    bar: {
                        c: 2,
                    }
                }
            });
        });

        it("2 level", () => {
            let root = {
                a: 0,
                foo: {
                    b: 1,
                    bar: {
                        c: 2,
                    }
                }
            };
            root = setDeep(root, "foo.bar.c", 999);
            expect(root).toEqual({
                a: 0,
                foo: {
                    b: 1,
                    bar: {
                        c: 999,
                    }
                }
            });
        });
    });

});
