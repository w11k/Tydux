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

            addEntry<F extends keyof FieldsOfType<S, RepositoryState<unknown> | undefined>>(
                repositoryField: F, entry: RepositoryType<S[F]>
            ) {

                const repo = this.getRepositoryState(repositoryField);
                repo.byList.push(entry);
                repo.byId[(entry as any)[repo.idField]] = entry;

            }

            saveList<F extends keyof FieldsOfType<S, RepositoryState<unknown> | undefined>>(
                repositoryField: F, list: RepositoryType<S[F]>[]
            ) {
                const repo = this.getRepositoryState(repositoryField);
            }

        }

        class TestCommands extends RepositoryCommands<TestState> {
        }

        class TestFacade extends Facade<TestCommands> {
            loadList() {
                const todoList: Todo[] = []; // fetch....
                const personList: Person[] = []; // fetch....

                this.commands.saveList("todos", todoList);
                this.commands.saveList("todos", 123);
                this.commands.saveList("todos", []);
                this.commands.saveList("persons", []);
                this.commands.saveList("persons", personList);
                this.commands.saveList("persons", todoList);
                this.commands.addEntry("persons", p1);
                this.commands.addEntry("persons", t1);

                this.commands.saveList("lastOpenedTodo", todoList);
                this.commands.saveList("foo", todoList);

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
