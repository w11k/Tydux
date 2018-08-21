import {assert} from "chai";
import {enableTyduxDevelopmentMode} from "./development";
import {resetTydux} from "./global-state";
import {createReducerFromMutator, Mutator} from "./mutator";

describe("ReducerFromMutator", function () {

    beforeEach(() => enableTyduxDevelopmentMode());

    afterEach(() => resetTydux());

    it("dispatches based on the method name", function () {
        class TestMutator extends Mutator<{ n1: number }> {
            mut1() {
                this.state.n1 += 10;
            }

            mut2() {
                this.state.n1 += 1000;
            }
        }

        const reducer = createReducerFromMutator(new TestMutator());
        let state = {n1: 0};

        state = reducer(state, {type: "mut1", arguments: []});
        assert.equal(state.n1, 10);
        state = reducer(state, {type: "mut2", arguments: []});
        assert.equal(state.n1, 1010);
    });

    it("directly returns the state on invalid action types", function () {
        class TestMutator extends Mutator<{ n1: number }> {
            mut1() {
                this.state.n1 += 10;
            }
        }

        const reducer = createReducerFromMutator(new TestMutator());
        let state = {n1: 0};

        state = reducer(state, {type: "invalid", arguments: []});
        assert.equal(state.n1, 0);
    });

    it("methods can have arguments", function () {
        class TestMutator extends Mutator<{ n1: number }> {
            mut1(param: number) {
                this.state.n1 += param;
            }
        }

        const reducer = createReducerFromMutator(new TestMutator());
        let state = {n1: 0};

        state = reducer(state, {type: "mut1", arguments: [10]});
        assert.equal(state.n1, 10);
        state = reducer(state, {type: "mut1", arguments: [5]});
        assert.equal(state.n1, 15);
    });

    it("can not access the state asynchronously", function (done) {
        class TestMutator extends Mutator<{ n1: number }> {
            mut1() {
                setTimeout(() => {
                    assert.throws(() => {
                        this.state.n1++;
                    });
                    done();
                }, 0);
            }
        }

        const reducer = createReducerFromMutator(new TestMutator());
        const state = {n1: 0};
        reducer(state, {type: "mut1"});
    });

    it("can not access other methods asynchronously", function (done) {
        class TestMutator extends Mutator<{ n1: number }> {
            mut1() {
                setTimeout(() => {
                    assert.throws(() => {
                        this.mut2();
                    });
                    done();
                }, 0);
            }

            mut2() {
                this.state.n1 = 9;
            }
        }

        const reducer = createReducerFromMutator(new TestMutator());
        const state = {n1: 0};
        reducer(state, {type: "mut1"});
    });

});


