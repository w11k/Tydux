import {Commands, CommandsInvoker, createReducerFromCommandsInvoker} from "./commands";
import {enableTyduxDevelopmentMode} from "./development";

describe("ReducerFromCommands", function () {

    beforeEach(() => enableTyduxDevelopmentMode());

    it("dispatches based on the method name", function () {
        class TestCommands extends Commands<{ n1: number }> {
            cmd1() {
                this.state.n1 += 10;
            }

            cmd2() {
                this.state.n1 += 1000;
            }
        }

        const reducer = createReducerFromCommandsInvoker("f", new CommandsInvoker(new TestCommands()));
        let state = {n1: 0};

        state = reducer(state, {type: "[f] cmd1", payload: []});
        expect(state.n1).toEqual(10);
        state = reducer(state, {type: "[f] cmd2", payload: []});
        expect(state.n1).toEqual(1010);
    });

    it("directly returns the state on invalid action types", function () {
        class TestCommands extends Commands<{ n1: number }> {
            cmd1() {
                this.state.n1 += 10;
            }
        }

        const reducer = createReducerFromCommandsInvoker("f", new CommandsInvoker(new TestCommands()));
        let state = {n1: 0};

        state = reducer(state, {type: "invalid", payload: []});
        expect(state.n1).toEqual(0);
    });

    it("methods can have arguments", function () {
        class TestCommands extends Commands<{ n1: number }> {
            cmd1(param: number) {
                this.state.n1 += param;
            }
        }

        const reducer = createReducerFromCommandsInvoker("f", new CommandsInvoker(new TestCommands()));
        let state = {n1: 0};

        state = reducer(state, {type: "[f] cmd1", payload: [10]});
        expect(state.n1).toEqual(10);
        state = reducer(state, {type: "[f] cmd1", payload: [5]});
        expect(state.n1).toEqual(15);
    });

    it("can not access the state asynchronously", function (done) {
        class TestCommands extends Commands<{ n1: number }> {
            cmd1() {
                setTimeout(() => {
                    expect(() => {
                        this.state.n1++;
                    }).toThrow();
                    done();
                }, 0);
            }
        }

        const reducer = createReducerFromCommandsInvoker("f", new CommandsInvoker(new TestCommands()));
        const state = {n1: 0};
        reducer(state, {type: "[f] cmd1", payload: []});
    });

    it("can not access other methods asynchronously", function (done) {
        class TestCommands extends Commands<{ n1: number }> {
            cmd1() {
                setTimeout(() => {
                    expect(() => {
                        this.mut2();
                    }).toThrow();
                    done();
                }, 0);
            }

            mut2() {
                this.state.n1 = 9;
            }
        }

        const reducer = createReducerFromCommandsInvoker("f", new CommandsInvoker(new TestCommands()));
        const state = {n1: 0};
        reducer(state, {type: "[f] cmd1", payload: []});
    });

});


