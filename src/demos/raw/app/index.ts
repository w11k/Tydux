import {enableDevelopmentMode} from "../../../devTools";
import {Mutators, Store} from "../../../Store";
import "./index.html";

enableDevelopmentMode();

export class Todo {
    constructor(public description: string, public done: boolean = false) {
    }
}

export class TodoState {

    todos: Todo[] = [
        new Todo("todo 1"),
        new Todo("todo 2")
    ];

}

export class TodoMutators extends Mutators<TodoState> {

    addTodo(todoName: string) {
        this.state.todos = [
            ...this.state.todos!,
            new Todo(todoName)
        ];
    }

}

export class TodoStore extends Store<TodoMutators, TodoState> {
    constructor() {
        super("todo", new TodoMutators(), new TodoState());
    }
}

const store: TodoStore = new TodoStore();
(window as any).store = store;

const renderApp = () => {
    document.body.innerHTML = `
        <div>
            <button onclick='(${() => store.dispatch.addTodo("")})();'>
                Add Todo
            </button>
        
            <ol>
                ${store.state.todos!.map(t => `<li>${t.description}</li>`).join("")}
            </ol>
        </div>
        `;
};

store.select()
    .subscribe(() => {
        renderApp();
    });
