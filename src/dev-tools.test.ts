import {assert} from "chai";
import {enableTyduxDevelopmentMode} from "./development";
import {globalStateChanges$, resetTydux} from "./global-state";
import {Commands} from "./commands";
import {Fassade} from "./Fassade";
import {createAsyncPromise} from "./test-utils";

describe("DevTools", function () {

    beforeEach(() => enableTyduxDevelopmentMode());

    afterEach(() => resetTydux());

    it("events contain the store and mutators name", function (done) {
        const eventActionTypes: string[] = [];

        class MyMutators extends Commands<any> {
            mut1() {
            }

            mut2() {
            }

            mut3() {
            }
        }

        class MyStore extends Fassade<MyMutators, any> {
            action1() {
                this.commands.mut1();
                this.commands.mut2();
            }

            action2() {
                this.commands.mut1();
                this.commands.mut3();
            }
        }

        globalStateChanges$.subscribe((event) => {
            eventActionTypes.push(event.mutatorAction.type);
        });

        const store = new MyStore("myStore", new MyMutators(), {});
        setTimeout(() => {
            store.action1();
            store.action1();

            setTimeout(() => {
                store.action2();

                setTimeout(() => {
                    assert.deepEqual(eventActionTypes, [
                        "@@INIT",
                        "mut1",
                        "mut2",
                        "mut1",
                        "mut2",
                        "mut1",
                        "mut3",
                    ]);
                    done();
                }, 0);
            }, 0);
        }, 0);

    });

    it("events contain the store and mutators name, support for async methods", function (done) {
        const eventActionTypes: string[] = [];

        class MyMutators extends Commands<any> {
            mut1() {
            }

            mut2() {
            }
        }

        class MyStore extends Fassade<MyMutators, any> {

            async action1() {
                this.commands.mut1();
                this.innerAction();
                this.commands.mut2();
                await createAsyncPromise(10);
                this.commands.mut1();
                this.innerAction();
                this.commands.mut2();

                setTimeout(() => {
                    assert.deepEqual(eventActionTypes, [
                        "@@INIT",
                        "mut1",
                        "mut1",
                        "mut2",
                        "mut2",
                        "mut1",
                        "mut1",
                        "mut2",
                        "mut2",
                    ]);
                    done();
                }, 0);
            }

            private innerAction() {
                this.commands.mut1();
                this.commands.mut2();
            }
        }

        globalStateChanges$.subscribe((event) => {
            eventActionTypes.push(event.mutatorAction.type);
        });

        const store = new MyStore("myStore", new MyMutators(), {});
        store.action1();
    });


});
