import {createTestFacade, createTestMount} from "../testing";
import {Commands} from "./commands";
import {
    arrayAppend,
    arrayPrepend,
    arrayRemoveFirst,
    createAssignCommand,
    createMutator,
    objectPatch
} from "./commands-mutators";
import {enableTyduxDevelopmentMode} from "./development";
import {Facade} from "./Facade";

class TestState {
    numberField = 0;
    arrayField: number[] = [1, 2];
    obj = {
        fieldA: 123,
        fieldB: "abc",
    };
}

describe("commands mutators", () => {

    beforeEach(() => enableTyduxDevelopmentMode());

    it("createAssignCommand", () => {
        class TestCommands extends Commands<TestState> {
            setN1 = createAssignCommand(this, "numberField");
        }

        class TestFacade extends Facade<TestState, TestCommands> {
            constructor() {
                super(createTestMount(new TestState()), undefined, new TestCommands());
            }

            op1() {
                this.commands.setN1(99);
            }
        }

        const tf = new TestFacade();
        tf.op1();
        expect(tf.state.numberField).toEqual(99);
    });

    it("createMutator", () => {

        const incNumberFn = (n: number) => () => n + 1;
        const incByNumberFn = (n: number) => (by: number) => n + by;

        class TestCommands extends Commands<TestState> {
            incNumberField = createMutator(this, "numberField", incNumberFn);
            incByNumberField = createMutator(this, "numberField", incByNumberFn);
        }

        class TestFacade extends Facade<TestState, TestCommands> {
            constructor() {
                super(createTestMount(new TestState()), undefined, new TestCommands());
            }

            op1() {
                this.commands.incNumberField();
                this.commands.incByNumberField(5);
            }
        }

        const tf = new TestFacade();
        tf.op1();
        expect(tf.state.numberField).toEqual(6);
    });

    // it("applyMutator without args", () => {
    //     const tf = createTestFacade(new class extends Commands<TestState> {
    //         command() {
    //             const incByNumberFn = (n: number) => () => n + 10;
    //             applyMutator(this, "numberField", incByNumberFn);
    //         }
    //     }, new TestState());
    //
    //     tf.commands.command();
    //     expect(tf.state.numberField).toEqual(10);
    // });
    //
    // it("applyMutator with 2 args", () => {
    //     const tf = createTestFacade(new class extends Commands<TestState> {
    //         command() {
    //             const incByNumberFn = (n: number) => (by1: number, by2: number) => n + by1 + by2;
    //             applyMutator(this, "numberField", incByNumberFn, 3, 7);
    //         }
    //     }, new TestState());
    //
    //     tf.commands.command();
    //     expect(tf.state.numberField).toEqual(10);
    // });

});

describe("operator functions for applyMutator", () => {

    beforeEach(() => enableTyduxDevelopmentMode());

    it("arrayAppend", () => {
        expect(arrayAppend(["a"])(["b"])).toEqual(["a", "b"]);
    });

    it("arrayPrepend", () => {
        expect(arrayPrepend(["a"])(["b"])).toEqual(["b", "a"]);

        class TestCommands extends Commands<TestState> {
            command = createMutator(this, "arrayField", arrayPrepend);
        }

        const tf = createTestFacade(new TestCommands(), new TestState());
        tf.commands.command([0, 1]);
        expect(tf.state.arrayField).toEqual([0, 1, 1, 2]);
    });

    it("arrayRemoveFirst", () => {
        expect(arrayRemoveFirst(["a", "b"])()).toEqual(["b"]);
    });

    it("objectPatch", () => {
        expect(objectPatch({a: 1, b: "b"})({b: "bb"})).toEqual({a: 1, b: "bb"});

        class TestCommands extends Commands<TestState> {
            command = createMutator(this, "obj", objectPatch);

            op() {
                this.state.obj = objectPatch(this.state.obj)({fieldB: "bbbb"});
            }
        }

        const tf = createTestFacade(new TestCommands(), new TestState());
        tf.commands.command({fieldB: "bbb"});
        expect(tf.state.obj).toEqual({fieldA: 123, fieldB: "bbb"});
        tf.commands.op();
        expect(tf.state.obj).toEqual({fieldA: 123, fieldB: "bbbb"});
    });

});
