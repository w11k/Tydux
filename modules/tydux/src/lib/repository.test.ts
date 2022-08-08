import {createStore} from "redux";
import {createTestMount} from "../testing";
import {Facade} from "./Facade";
import {createRepositoryState, RepositoryCommands} from "./repository";
import {TyduxReducerBridge} from "./store";
import {removeGlobalStore, setGlobalStore} from "./store-global";


class Todo {
    constructor(public id: string, public text: string, public state: boolean) {
    }
}
const idField = "id";

class TestState {
    todos = createRepositoryState<Todo, "id">(idField);
}

describe("Repository", () => {

    const t1 = new Todo("1", "foo", false);
    const t2 = new Todo("2", "bar", false);
    const t3 = new Todo("3", "baz", true);
    const t4 = new Todo("4", "buz", true);

    const t1Updated = new Todo("1", "foo", true);
    const t2Updated = new Todo("2", "bar", true);

    const t1Patch = {id: "1", text: "patched"};
    const t1Patched = new Todo("1", "patched", false);

    const t3Update = {id: "3", text: "patched"};
    const t3Patched = new Todo("3", "patched", true);

    class TestCommands extends RepositoryCommands<TestState> {
    }

    afterEach(() => {
        removeGlobalStore();
    });

    beforeEach(() => {
        const tyduxBridge = new TyduxReducerBridge();
        const reduxStore = createStore(tyduxBridge.createTyduxReducer(), {});
        const tyduxStore = tyduxBridge.connectStore(reduxStore);
        setGlobalStore(tyduxStore);
    });

    describe("createRepositoryState", () => {
        it("create an empty repository state", () => {
            const state = createRepositoryState<Todo, "id">("id");
            expect(state).toEqual({
                idField,
                byList: [],
                byId: {}
            })
        });

        it("create an repository state with an initial value (object)", () => {
            const state = createRepositoryState<Todo, "id">(idField, {1: t1, 2: t2});
            expect(state).toEqual({
                idField,
                byList: [t1, t2],
                byId: {1: t1, 2: t2}
            })
        });

        it("create an repository state with an initial value (array)", () => {
            const state = createRepositoryState<Todo, "id">(idField, [t3, t4]);
            expect(state).toEqual({
                idField,
                byList: [t3, t4],
                byId: {3: t3, 4: t4}
            })
        });
    });

    describe("updateOrPushEntry", () => {
        it("should add one entry", () => {

            class TestFacade extends Facade<TestCommands> {
                addOne() {
                    this.commands.updateOrPushEntry("todos", t2);
                }
            }

            const initialState = {todos: {byList: [t1], byId: {1: t1}, idField}};
            const facade = new TestFacade(createTestMount(new TestState()), new TestCommands(), initialState);

            facade.addOne();

            expect(facade.state.todos.byList).toEqual([t1, t2]);
            expect(facade.state.todos.byId[1]).toEqual(t1);
            expect(facade.state.todos.byId[2]).toEqual(t2);
        });

        it("should update one entry", () => {

            class TestFacade extends Facade<TestCommands> {
                updateOne() {
                    this.commands.updateOrPushEntry("todos", t1Updated);
                }
            }

            const initialState = {todos: {byList: [t1], byId: {1: t1}, idField}};
            const facade = new TestFacade(createTestMount(new TestState()), new TestCommands(), initialState);

            facade.updateOne();

            expect(facade.state.todos.byList).toEqual([t1Updated]);
            expect(facade.state.todos.byId[1]).toEqual(t1Updated);
        });
    });

    describe("updateOrPushEntries", () => {
        it("should add multiple entries", () => {

            class TestFacade extends Facade<TestCommands> {
                addMultiple() {
                    this.commands.updateOrPushEntries("todos", [t2, t3]);
                }
            }

            const initialState = {todos: {byList: [t1], byId: {1: t1}, idField}};
            const facade = new TestFacade(createTestMount(new TestState()), new TestCommands(), initialState);

            facade.addMultiple();

            expect(facade.state.todos.byList).toEqual([t1, t2, t3]);
            expect(facade.state.todos.byId[1]).toEqual(t1);
            expect(facade.state.todos.byId[2]).toEqual(t2);
            expect(facade.state.todos.byId[3]).toEqual(t3);
        });

        it("should update multiple entries", () => {

            class TestFacade extends Facade<TestCommands> {
                updateMultiple() {
                    this.commands.updateOrPushEntries("todos", {1: t1Updated, 2: t2Updated});
                }
            }

            const initialState = {todos: {byList: [t1, t2, t3], byId: {1: t1, 2: t2, 3: t3}, idField}};
            const facade = new TestFacade(createTestMount(new TestState()), new TestCommands(), initialState);

            facade.updateMultiple();

            expect(facade.state.todos.byList).toEqual([t1Updated, t2Updated, t3]);
            expect(facade.state.todos.byId[1]).toEqual(t1Updated);
            expect(facade.state.todos.byId[2]).toEqual(t2Updated);
            expect(facade.state.todos.byId[3]).toEqual(t3);
        });
    });

    describe("setPositionOfEntry", () => {

        it("should set position of entry to the START of the list", () => {

            class TestFacade extends Facade<TestCommands> {
                setPositionToStart() {
                    this.commands.setPositionOfEntry("todos", t1, "start");
                }
            }
            const initialState = {todos: {byList: [t2, t1, t3], byId: {2: t2, 1: t1, 3: t3}, idField}};

            const facade = new TestFacade(createTestMount(new TestState()), new TestCommands(), initialState);
            facade.setPositionToStart();

            expect(facade.state.todos.byList).toEqual([t1, t2, t3]);

            expect(facade.state.todos.byId[1]).toBe(t1);
            expect(facade.state.todos.byId[2]).toEqual(t2);
            expect(facade.state.todos.byId[3]).toEqual(t3);
        });
        it("should set position of entry to the END of the list", () => {

            class TestFacade extends Facade<TestCommands> {
                setPositionToEnd() {
                    this.commands.setPositionOfEntry("todos", t3, "end");
                }
            }

            const initialState = {todos: {byList: [t1, t3, t2], byId: {1: t1, 3: t3, 2: t2}, idField}};
            const facade = new TestFacade(createTestMount(new TestState()), new TestCommands(), initialState);

            facade.setPositionToEnd();

            expect(facade.state.todos.byList).toEqual([t1, t2, t3]);
            expect(facade.state.todos.byId[1]).toEqual(t1);
            expect(facade.state.todos.byId[2]).toEqual(t2);
            expect(facade.state.todos.byId[3]).toEqual(t3);
        });

        it("should set position of entry to a specific index", () => {

            class TestFacade extends Facade<TestCommands> {
                setPositionToIndex() {
                    this.commands.setPositionOfEntry("todos", t1, 0);
                }
            }

            const initialState = {todos: {byList: [t2, t1, t3], byId: {1: t1, 3: t3, 2: t2}, idField}};
            const facade = new TestFacade(createTestMount(new TestState()), new TestCommands(), initialState);

            facade.setPositionToIndex();

            expect(facade.state.todos.byList).toEqual([t1, t2, t3]);
            expect(facade.state.todos.byId[1]).toEqual(t1);
            expect(facade.state.todos.byId[2]).toEqual(t2);
            expect(facade.state.todos.byId[3]).toEqual(t3);
        });

        it("should throw an error when trying to set position when entry does not exist", () => {

            class TestFacade extends Facade<TestCommands> {
                setPositionToStart() {
                    this.commands.setPositionOfEntry("todos", t1, "start");
                }
            }

            const facade = new TestFacade(createTestMount(new TestState()), new TestCommands(), undefined);

            expect(facade.setPositionToStart).toThrow('Entry does not exist');
        });

        it("should NOT be possible to set position of entry before the START of the list", () => {

            class TestFacade extends Facade<TestCommands> {
                setPositionBeforeStart() {
                    this.commands.setPositionOfEntry("todos", t1, -1);
                }
            }

            const initialState = {todos: {byList: [t2, t1, t3], byId: {2: t2, 1: t1, 3: t3}, idField}};
            const facade = new TestFacade(createTestMount(new TestState()), new TestCommands(), initialState);

            expect(facade.setPositionBeforeStart).toThrow('Index must at least be in the scope from 0 to 2');
        });

        it("should NOT be possible to set position of entry after the END of the list", () => {

            class TestFacade extends Facade<TestCommands> {
                setPositionAfterEnd() {
                    this.commands.setPositionOfEntry("todos", t1, 3);
                }
            }

            const initialState = {todos: {byList: [t2, t1, t3], byId: {2: t2, 1: t1, 3: t3}, idField}};
            const facade = new TestFacade(createTestMount(new TestState()), new TestCommands(), initialState);

            expect(facade.setPositionAfterEnd).toThrow('Index must at least be in the scope from 0 to 2');
        });
    });

    describe("setPositionOfEntries", () => {
        it("should set position of entries to the START of the list", () => {
            class TestFacade extends Facade<TestCommands> {
                setPositionsToStart() {
                    this.commands.setPositionOfEntries("todos", [t1, t2], "start");
                }
            }

            const initialState = {todos: {byList: [t3, t1, t2], byId: {2: t2, 1: t1, 3: t3}, idField}};
            const facade = new TestFacade(createTestMount(new TestState()), new TestCommands(), initialState);

            facade.setPositionsToStart();

            expect(facade.state.todos.byList).toEqual([t1, t2, t3]);
            expect(facade.state.todos.byId[1]).toBe(t1);
            expect(facade.state.todos.byId[2]).toEqual(t2);
            expect(facade.state.todos.byId[3]).toEqual(t3);
        });

        it("should set position of entries to the END of the list", () => {

            class TestFacade extends Facade<TestCommands> {
                setPositionsToEnd() {
                    this.commands.setPositionOfEntries("todos", [t3, t4], "end");
                }
            }

            const initialState = {todos: {byList: [t3, t4, t1, t2], byId: {1: t1, 3: t3, 2: t2, 4: t4}, idField}};
            const facade = new TestFacade(createTestMount(new TestState()), new TestCommands(), initialState);

            facade.setPositionsToEnd();

            expect(facade.state.todos.byList).toEqual([t1, t2, t3, t4]);
            expect(facade.state.todos.byId[1]).toEqual(t1);
            expect(facade.state.todos.byId[2]).toEqual(t2);
            expect(facade.state.todos.byId[3]).toEqual(t3);
        });

        it("should set position of entry to a specific index", () => {

            class TestFacade extends Facade<TestCommands> {
                setPositionsIndex() {
                    this.commands.setPositionOfEntries("todos", [t1, t2], 0);
                }
            }

            const initialState = {todos: {byList: [t2, t1, t3], byId: {1: t1, 3: t3, 2: t2}, idField}};
            const facade = new TestFacade(createTestMount(new TestState()), new TestCommands(), initialState);

            facade.setPositionsIndex();

            expect(facade.state.todos.byList).toEqual([t1, t2, t3]);
            expect(facade.state.todos.byId[1]).toEqual(t1);
            expect(facade.state.todos.byId[2]).toEqual(t2);
            expect(facade.state.todos.byId[3]).toEqual(t3);
        });

        it("should throw error when trying to set position when entry does not exist", () => {

            class TestFacade extends Facade<TestCommands> {
                setPositionToStart() {
                    this.commands.setPositionOfEntries("todos", [t1], "start");
                }
            }

            const facade = new TestFacade(createTestMount(new TestState()), new TestCommands(), undefined);

            try {
                facade.setPositionToStart();
            } catch ({message}) {
                expect(message).toEqual("Some of the entries do not exist");
            }
        });
    });

    describe("patchEntry", () => {
        it("should patch one partial entry", () => {
            class TestFacade extends Facade<TestCommands> {
                patchOne() {
                    this.commands.patchEntry("todos", t1Patch);
                }
            }

            const initialState = {todos: {byList: [t1], byId: {1: t1}, idField}};
            const facade = new TestFacade(createTestMount(new TestState()), new TestCommands(), initialState);

            facade.patchOne();

            expect(facade.state.todos.byId[1]).toEqual(t1Patched);
            expect(facade.state.todos.byList).toEqual([t1Patched]);
        });
    });

    describe("patchEntries", () => {
        it("should patch multiple partial entries", () => {
            class TestFacade extends Facade<TestCommands> {
                patchMultiple() {
                    this.commands.patchEntries("todos", [t1Patch, t3Update]);
                }
            }

            const initialState = {todos: {byList: [t1, t3], byId: {1: t1, 3: t3}, idField}};
            const facade = new TestFacade(createTestMount(new TestState()), new TestCommands(), initialState);

            facade.patchMultiple();

            expect(facade.state.todos.byId[1]).toEqual(t1Patched);
            expect(facade.state.todos.byList).toEqual([t1Patched, t3Patched]);
        });
    });

    describe("removeEntry", () => {
        it("should remove one entry", () => {
            class TestFacade extends Facade<TestCommands> {
                removeOne() {
                    this.commands.removeEntry("todos", "1");
                }
            }

            const initialState = {todos: {byList: [t1, t2], byId: {1: t1, 2: t2}, idField}};
            const facade = new TestFacade(createTestMount(new TestState()), new TestCommands(), initialState);

            facade.removeOne();

            expect(facade.state.todos.byId[1]).toEqual(undefined);
            expect(facade.state.todos.byId[2]).toEqual(t2);
            expect(facade.state.todos.byList).toEqual([t2]);
        });
    });

    describe("removeEntries", () => {
        it("should remove multiple entry", () => {
            class TestFacade extends Facade<TestCommands> {
                removeMultiple() {
                    this.commands.removeEntries("todos", ["1", "2"]);
                }
            }

            const initialState = {todos: {byList: [t1, t2, t3], byId: {1: t1, 2: t2, 3: t3}, idField}};
            const facade = new TestFacade(createTestMount(new TestState()), new TestCommands(), initialState);

            facade.removeMultiple();

            expect(facade.state.todos.byId[1]).toEqual(undefined);
            expect(facade.state.todos.byId[2]).toEqual(undefined);
            expect(facade.state.todos.byId[3]).toEqual(t3);
            expect(facade.state.todos.byList).toEqual([t3]);
        });
    });

    describe("removeAllEntries", () => {
        it("should remove all entries", () => {
            class TestFacade extends Facade<TestCommands> {
                clearAll() {
                    this.commands.removeAllEntries("todos");
                }
            }

            const initialState = {todos: {byList: [t1, t2, t3], byId: {1: t1, 2: t2, 3: t3}, idField}};
            const facade = new TestFacade(createTestMount(new TestState()), new TestCommands(), initialState);

            facade.clearAll();

            expect(facade.state.todos.byId).toEqual({});
            expect(facade.state.todos.byList).toEqual([]);
        });
    });
});
