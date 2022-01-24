import {createStore} from "redux";
import {Commands} from "./commands";
import {Facade} from "./Facade";
import {TyduxReducerBridge} from "./store";
import {removeGlobalStore, setGlobalStore} from "./store-global";

type FilterFlags<Base, Condition> = {
    [Key in keyof Base]:
    Base[Key] extends Condition ? Key : never
};

type AllowedNames<Base, Condition> =
    FilterFlags<Base, Condition>[keyof Base];

export type FieldsOfType<Base, Condition> =
    Pick<Base, AllowedNames<Base, Condition>>;


describe("Repository", () => {

    afterEach(() => {
        removeGlobalStore();
    });

    it("tbd", () => {

        class Todo {
            constructor(public id: string, public text: string, public state: boolean) {
            }
        }

        const t1 = new Todo("1", "foo", false);
        const t2 = new Todo("2", "bar", false);
        const t3 = new Todo("3", "baz", true);
        const t3Partial: Partial<Todo> = {state: false};

        class Person {
            constructor(public id: string, public name: string) {
            }
        }

        const p1 = new Person("1", "Mario");
        const p2 = new Person("2", "Kai");
        const p3 = new Person("3", "Roman");

        type RepositoryState<T> = {
            idField: string;
            byList: T[];
            byId: { [id: string]: T };
        };

        type RepositoryType<R /*extends RepositoryState<unknown>*/> = R extends RepositoryState<infer T> ? T : never;

        type Update<T> = {
            id: string;
            changes: any // todo typings;
        };

        function createRepositoryState<T>(idField: keyof FieldsOfType<T, string | number>): RepositoryState<T> {
            const s = idField.toString();
            return {
                idField: s,
                byList: [] as T[],
                byId: {} as { [id: string]: T },
            };
        }

        class TestState {
            todos = createRepositoryState<Todo>("id");
            persons = createRepositoryState<Person>("id");
            todosWrong = createRepositoryState<Todo>("state");
            lastOpenedTodo?: Todo = undefined;
            foo = 1;
        }

        class RepositoryCommands<S> extends Commands<S> {

            private getRepositoryState(field: keyof S): RepositoryState<unknown> {
                return (this.state as any)[field];
            }

            // add one
            addEntry<F extends keyof FieldsOfType<S, RepositoryState<unknown> | undefined>>(
                repositoryField: F, entry: RepositoryType<S[F]>
            ) {

                const repo = this.getRepositoryState(repositoryField);
                repo.byList.push(entry);
                repo.byId[(entry as any)[repo.idField]] = entry;

            }

            // add or replace one
            setEntry<F extends keyof FieldsOfType<S, RepositoryState<unknown> | undefined>>(
                repositoryField: F, entry: RepositoryType<S[F]>
            ) {
                // tbd
            }

            // add multiple
            addEntries<F extends keyof FieldsOfType<S, RepositoryState<unknown> | undefined>>(
                repositoryField: F, entries: RepositoryType<S[F]>[] | Record<string, RepositoryType<S[F]>>
            ) {
                // tbd
            }

            // add or replace multiple
            setEntries<F extends keyof FieldsOfType<S, RepositoryState<unknown> | undefined>>(
                repositoryField: F, entries: RepositoryType<S[F]>[] | Record<string, RepositoryType<S[F]>>
            ) {
                // tbd
            }

            // replaces all existing
            setAllEntries<F extends keyof FieldsOfType<S, RepositoryState<unknown> | undefined>>(
                repositoryField: F, list: RepositoryType<S[F]>[] | Record<string, RepositoryType<S[F]>>
            ) {
                // tbd
            }

            // add or update one. Supports partial updates
            upsertEntry<F extends keyof FieldsOfType<S, RepositoryState<unknown> | undefined>>(
                repositoryField: F, update: Update<RepositoryType<S[F]>>
            ) {
                // tbd
            }

            // add or update multiple. Supports partial updates
            upsertEntries<F extends keyof FieldsOfType<S, RepositoryState<unknown> | undefined>>(
                repositoryField: F, updates: Update<RepositoryType<S[F]>>[]
            ) {
                // tbd
            }

            // remove one
            removeEntry<F extends keyof FieldsOfType<S, RepositoryState<unknown> | undefined>>(
                repositoryField: F, id: string
            ) {
                // tbd
            }

            // remove multiple
            removeEntries<F extends keyof FieldsOfType<S, RepositoryState<unknown> | undefined>>(
                repositoryField: F, ids: string[]
            ) {
                // tbd
            }

            // clear all
            removeAllEntries<F extends keyof FieldsOfType<S, RepositoryState<unknown> | undefined>>(
                repositoryField: F
            ) {
                // tbd
            }
        }

        class TestCommands extends RepositoryCommands<TestState> {
        }

        class TestFacade extends Facade<TestCommands> {
            loadList() {
                const todoList: Todo[] = []; // fetch....
                const personList: Person[] = []; // fetch....

                this.commands.setAllEntries("todos", todoList);
                this.commands.setAllEntries("todos", 123);
                this.commands.setAllEntries("todos", []);
                this.commands.setAllEntries("persons", []);
                this.commands.setAllEntries("persons", personList);
                this.commands.setAllEntries("persons", todoList);
                this.commands.setAllEntries("lastOpenedTodo", todoList);
                this.commands.setAllEntries("foo", todoList);

                this.commands.addEntry("persons", p1);
                this.commands.addEntry("persons", t1);

                this.commands.addEntries("persons", {1: p1, 2: p2});
                this.commands.addEntries("persons", {1: t1, 2: t2});
                this.commands.addEntries("persons", personList);
                this.commands.addEntries("persons", todoList);


                this.commands.setEntry("persons", p1);
                this.commands.setEntry("persons", t1);

                this.commands.setEntries("persons", {1: p1, 2: p2});
                this.commands.setEntries("persons", {1: t1, 2: t2});
                this.commands.setEntries("persons", personList);
                this.commands.setEntries("persons", todoList);

                this.commands.upsertEntry("todos", { id: "1", changes: t1 }); // --> should work
                this.commands.upsertEntry("todos", { id: "3", changes: t3Partial }); // --> should work
                this.commands.upsertEntry("todos", { id: "1", changes: p1 }); // --> should not work
                this.commands.upsertEntry("todos", { id: "3", changes: 123 });

                this.commands.upsertEntries("todos", [{ id: "1", changes: t1 }, { id: "2", changes: t2 }]); // --> should work
                this.commands.upsertEntries("todos", [{ id: "3", changes: t3Partial }]); // --> should work
                this.commands.upsertEntries("todos", [{ id: "1", changes: p1 }, { id: "2", changes: p2 }]); // --> should not work
                this.commands.upsertEntries("todos", [{ id: "3", changes: 123 }]); // --> should not work

                this.commands.removeEntry("todos", "1");
                this.commands.removeEntries("todos", ["1", "2"]);
                this.commands.removeAllEntries("todos");
            }
        }

        const tyduxBridge = new TyduxReducerBridge();
        const reduxStore = createStore(tyduxBridge.createTyduxReducer(), {});
        const tyduxStore = tyduxBridge.connectStore(reduxStore);
        setGlobalStore(tyduxStore);

        const facade = new TestFacade("test", new TestCommands(), new TestState());
        console.log("facade", facade);


    });

});
