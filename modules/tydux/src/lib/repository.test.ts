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

class Person {
    constructor(public id: string, public name: string) {
    }
}

class TestState {
    todos = createRepositoryState<Todo>("id");
}

describe("Repository", () => {

    const t1 = new Todo("1", "foo", false);
    const t2 = new Todo("2", "bar", false);
    const t3 = new Todo("3", "baz", true);
    const t4 = new Todo("4", "buz", true);

    const t1Updated = new Todo("1", "foo", true);
    const t2Updated = new Todo("2", "bar", true);

    const t1Partial: Partial<Todo> = {state: true};
    const t1Patched = new Todo("1", "foo", true);
    const t3Partial: Partial<Todo> = {text: "patched"};
    const t3Patched = new Todo("3", "patched", true);

    const p1 = new Person("1", "Mario");
    const p2 = new Person("2", "Kai");
    const p3 = new Person("3", "Roman");

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

    describe("updateOrPushEntry", () => {
        it("should add one entry", () => {

            class TestFacade extends Facade<TestCommands> {
                addOne() {
                    this.commands.updateOrPushEntry("todos", t2);
                }
            }

            const initialState = {todos: {byList: [t1], byId: {1: t1}, idField: "id"}};
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

            const initialState = {todos: {byList: [t1], byId: {1: t1}, idField: "id"}};
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

            const initialState = {todos: {byList: [t1], byId: {1: t1}, idField: "id"}};
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

            const initialState = {todos: {byList: [t1, t2, t3], byId: {1: t1, 2: t2, 3: t3}, idField: "id"}};
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

            const initialState = {todos: {byList: [t2, t1, t3], byId: {2: t2, 1: t1, 3: t3}, idField: "id"}};
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

            const initialState = {todos: {byList: [t1, t3, t2], byId: {1: t1, 3: t3, 2: t2}, idField: "id"}};
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

            const initialState = {todos: {byList: [t2, t1, t3], byId: {1: t1, 3: t3, 2: t2}, idField: "id"}};
            const facade = new TestFacade(createTestMount(new TestState()), new TestCommands(), initialState);

            facade.setPositionToIndex();

            expect(facade.state.todos.byList).toEqual([t1, t2, t3]);
            expect(facade.state.todos.byId[1]).toEqual(t1);
            expect(facade.state.todos.byId[2]).toEqual(t2);
            expect(facade.state.todos.byId[3]).toEqual(t3);
        });

        it("should throw error when trying to set position when entry does not exist", () => {

            class TestFacade extends Facade<TestCommands> {
                setPositionToStart() {
                    this.commands.setPositionOfEntry("todos", t1, "start");
                }
            }

            const facade = new TestFacade(createTestMount(new TestState()), new TestCommands(), undefined);

            try {
                facade.setPositionToStart();
            } catch ({message}) {
                expect(message).toEqual('Entry does not exist');
            }
        });
    });

    describe("setPositionOfEntries", () => {
        it("should set position of entries to the START of the list", () => {
            class TestFacade extends Facade<TestCommands> {
                setPositionsToStart() {
                    this.commands.setPositionOfEntries("todos", [t1, t2], "start");
                }
            }

            const initialState = {todos: {byList: [t3, t1, t2], byId: {2: t2, 1: t1, 3: t3}, idField: "id"}};
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

            const initialState = {todos: {byList: [t3, t4, t1, t2], byId: {1: t1, 3: t3, 2: t2, 4: t4}, idField: "id"}};
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

            const initialState = {todos: {byList: [t2, t1, t3], byId: {1: t1, 3: t3, 2: t2}, idField: "id"}};
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
                    this.commands.patchEntry("todos", {id: "1", changes: t1Partial});
                }
            }

            const initialState = {todos: {byList: [t1], byId: {1: t1}, idField: "id"}};
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
                    this.commands.patchEntries("todos", [{id: "1", changes: t1Partial}, {id: "3", changes: t3Partial}]);
                }
            }

            const initialState = {todos: {byList: [t1, t3], byId: {1: t1, 3: t3}, idField: "id"}};
            const facade = new TestFacade(createTestMount(new TestState()), new TestCommands(), initialState);

            facade.patchMultiple();

            expect(facade.state.todos.byId[1]).toEqual(t1Patched);
            expect(facade.state.todos.byList).toEqual([t1Patched, t3Patched]);
        });
    });
});
