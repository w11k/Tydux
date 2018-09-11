import {assert} from "chai";
import {Commands} from "./commands";
import {Fassade} from "./Fassade";
import {collect, createTestMount} from "./test-utils";
import {isNil} from "./utils";


describe("Fassade", function () {

    it("ID must be unique", function () {
        const mount = createTestMount({});

        class TestFassade extends Fassade<any, any> {
            createCommands() {
                return new Commands();
            }
        }

        const tf1 = new TestFassade(mount);
        const tf2 = new TestFassade(mount);
        assert.notEqual(tf1.fassadeId, tf2.fassadeId);
    });

    it("select()", function () {
        class TestCommands extends Commands<{ n1: number }> {
            inc() {
                this.state.n1++;
            }
        }

        class TestFassade extends Fassade<{ n1: number }, TestCommands> {
            createCommands() {
                return new TestCommands();
            }

            actionInc() {
                this.commands.inc();
            }
        }

        const mount = createTestMount({n1: 0});
        const store = new TestFassade(mount);
        let collected = collect(store.select().unbounded());
        store.actionInc();
        store.actionInc();

        collected.assert({n1: 0}, {n1: 1}, {n1: 2});
    });

    it("select(with selector)", function () {
        class TestCommands extends Commands<{ n1: number }> {
            inc() {
                this.state.n1++;
            }
        }

        class TestFassade extends Fassade<{ n1: number }, TestCommands> {
            createCommands() {
                return new TestCommands();
            }

            actionInc() {
                this.commands.inc();
            }
        }

        const store = new TestFassade(createTestMount({n1: 0}));
        let collected = collect(store.select(s => s.n1).unbounded());
        store.actionInc();
        store.actionInc();

        collected.assert(0, 1, 2);
    });

    it("selectNonNil(with selector)", function () {
        class TestState {
            n1?: number;
        }

        class TestCommands extends Commands<TestState> {
            inc() {
                this.state.n1 = !isNil(this.state.n1) ? this.state.n1 + 1 : 1;
            }

            clear() {
                this.state.n1 = undefined;
            }
        }

        class TestFassade extends Fassade<TestState, TestCommands> {
            createCommands() {
                return new TestCommands();
            }

            actionInc() {
                this.commands.inc();
            }

            actionClear() {
                this.commands.clear();
            }
        }

        const mount = createTestMount(new TestState());
        const store = new TestFassade(mount);
        let collected = collect(store.selectNonNil(s => s.n1).unbounded());
        store.actionInc(); // 1
        store.actionClear();
        store.actionInc(); // 1
        store.actionInc(); // 2
        store.actionClear();
        store.actionInc(); // 1


        collected.assert(1, 1, 2, 1);
    });

    /*

        it("select(with selector return an Arrays) only emits values when the content of the array changes", async function () {
            class TestCommands extends Commands<{ a: number; b: number; c: number }> {
                incAB() {
                    this.state.count++;
                    this.state.b++;
                }

                incC() {
                    this.state.c++;
                }
            }

            class TestFassade extends Fassade<TestCommands, { a: number; b: number; c: number }> {
                actionIncAB() {
                    this.commands.incAB();
                }

                actionIncC() {
                    this.commands.incC();
                }
            }

            const store = new TestFassade("", new TestCommands(), {count: 0, b: 10, c: 100});
            let collected = collect(store.select(s => [s.count, s.b]).unbounded());
            store.actionIncAB();
            store.actionIncC();
            store.actionIncAB();
            store.actionIncC();

            await afterAllStoreEvents(store);

            collected.assert([0, 10], [1, 11], [2, 12]);
        });

        it("select(with selector return an object) only emits values when the content of the object changes", async function () {
            class TestCommands extends Commands<{ a: number; b: number; c: number }> {
                incAB() {
                    this.state.count++;
                    this.state.b++;
                }

                incC() {
                    this.state.c++;
                }
            }

            class TestFassade extends Fassade<TestCommands, { a: number; b: number; c: number }> {
                actionIncAB() {
                    this.commands.incAB();
                }

                actionIncC() {
                    this.commands.incC();
                }
            }

            const store = new TestFassade("", new TestCommands(), {count: 0, b: 10, c: 100});
            let collected = collect(store.select(s => {
                return {
                    count: s.count,
                    b: s.b
                };
            }).unbounded());
            store.actionIncAB();
            store.actionIncC(); // should not trigger select()
            store.actionIncAB();
            store.actionIncC(); // should not trigger select()

            await afterAllStoreEvents(store);

            collected.assert(
                {count: 0, b: 10},
                {count: 1, b: 11},
                {count: 2, b: 12},
            );
        });

        it("select() only triggers when the selected value deeply changed" +
            "", async function () {
            class TestCommands extends Commands<{ root: { child: { val1: number } } }> {
                dummy() {
                }
            }

            class TestFassade extends Fassade<TestCommands, { root: { child: { val1: number } } }> {
                action() {
                    this.commands.dummy();
                }
            }

            const state = {root: {child: {val1: 1}}};
            const store = new TestFassade("", new TestCommands(), state);
            let collected = collect(store.select(s => s.root).unbounded());
            store.action(); // should not trigger select()
            store.action(); // should not trigger select()
            store.action(); // should not trigger select()

            await afterAllStoreEvents(store);

            collected.assert(
                state.root
            );
        });

        it("select() gets called on every `.mutate...` method invocation", async function () {
            class MyState {
                count = 0;
            }

            class MyCommandss extends Commands<MyState> {
                increment() {
                    this.state.count++;
                }

                decrement() {
                    this.state.count--;
                }
            }

            class MyStore extends Fassade<MyCommandss, MyState> {
                action() {
                    this.commands.increment();
                    this.commands.increment();
                    this.commands.decrement();
                }
            }

            const store = new MyStore("myStore", new MyCommandss(), new MyState());
            let collected = collect(store.select(s => s.count).unbounded());
            store.action();

            await afterAllStoreEvents(store);

            collected.assert(0, 1, 2, 1);
        });

        it("keeps state between action invocations", function () {
            class MyState {
                list: number[] = [];
                value?: number;
            }

            class MyCommandss extends Commands<MyState> {
                setList(list: number[]) {
                    this.state.list = list;
                }

                setValue(value: number) {
                    this.state.value = value;
                }
            }

            class MyStore extends Fassade<MyCommandss, MyState> {
                setList() {
                    this.commands.setList([1, 2, 3]);
                }

                setValue() {
                    this.commands.setValue(99);
                }
            }

            const store = new MyStore("myStore", new MyCommandss(), new MyState());
            store.setList();
            store.setValue();

            assert.deepEqual(store.state.list, [1, 2, 3]);
            assert.equal(store.state.value, 99);
        });

        it("keeps state between action async invocations", async function () {
            class MyState {
                list: number[] = [];
                value?: number;
            }

            class MyCommandss extends Commands<MyState> {
                setList(list: number[]) {
                    this.state.list = list;
                }

                setValue(value: number) {
                    assert.deepEqual(this.state.list, [1, 2, 3]);
                    this.state.value = value;
                }
            }

            class MyStore extends Fassade<MyCommandss, MyState> {
                async setList() {
                    const list = await createAsyncPromise([1, 2, 3]);
                    this.commands.setList(list);
                }

                async setValue() {
                    const value = await createAsyncPromise(99);
                    this.commands.setValue(value);
                }
            }

            const store = new MyStore("myStore", new MyCommandss(), new MyState());
            await store.setList();
            await store.setValue();

            assert.deepEqual(store.state.list, [1, 2, 3]);
            assert.equal(store.state.value, 99);
        });

        it("emits CommandsEvents in the correct order when re-entrant code exists", async function () {
            class TestCommands extends Commands<{ list1: number[], list2: number[] }> {
                setList1(list: number[]) {
                    this.state.list1 = list;
                }

                setList2(list: number[]) {
                    this.state.list2 = list;
                }
            }

            class TestFassade extends Fassade<TestCommands, { list1: number[], list2: number[] }> {

                private counter = 0;

                constructor() {
                    super("test", new TestCommands(), {list1: [], list2: []});

                    this.processedActions$
                        .pipe(
                            map(event => event.state.list1),
                            distinctUntilChanged((val1, val2) => areArraysShallowEquals(val1, val2))
                        )
                        .subscribe(list1 => {
                            this.commands.setList2([...this.state.list2, list1.length]);
                        });
                }

                action() {
                    this.commands.setList1([
                        this.counter++,
                    ]);
                }
            }

            const store = new TestFassade();

            const events: any[] = [];
            store.processedActions$.subscribe(event => {
                events.push([event.CommandsAction.type, event.state]);
            });

            store.action();

            await afterAllStoreEvents(store);

            assert.deepEqual(events, [
                ["@@INIT", {list1: [], list2: []}],
                ["setList1", {list1: [0], list2: []}],
                ["setList2", {list1: [0], list2: [0]}],
                ["setList2", {list1: [0], list2: [0, 1]}],
            ]);
        });

        it("destroy() completes processedActions$ observable", function (done) {
            class TestFassade extends Fassade<Commands<any>, { n1: number }> {
            }

            const store = new TestFassade("", new Commands(), {n1: 0});
            store.processedActions$.subscribe(NOOP, NOOP, done);
            store.destroy();
        });

        it("destroy() completes observable returned by select()", function (done) {
            class TestFassade extends Fassade<Commands<any>, { n1: number }> {
            }

            const store = new TestFassade("", new Commands(), {n1: 0});
            store.select().unbounded().subscribe(NOOP, NOOP, done);
            store.destroy();
        });

        it("destroy() completes observable returned by selectNonNil()", function (done) {
            class TestFassade extends Fassade<Commands<any>, { n1: number }> {
            }

            const store = new TestFassade("", new Commands(), {n1: 0});
            store.selectNonNil(s => s).unbounded().subscribe(NOOP, NOOP, done);
            store.destroy();
        });
    */

});
