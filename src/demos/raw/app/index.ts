import {enableDevelopmentMode} from "../../../devTools";
import {Mutators, Store} from "../../../Store";
import "./index.html";

enableDevelopmentMode();

export class Todo {
    constructor(public description: string,
                public complete: boolean = false) {
    }
}

export class TodoState {

    filter = "";

    todos: Todo[] = [
        new Todo("todo 1", true),
        new Todo("todo 2")
    ];

}

export class TodoMutators extends Mutators<TodoState> {

    addTodo(todoName: string) {
        this.state.todos.push(new Todo(""));
        this.state.todos = [
            ...this.state.todos,
            new Todo(todoName)
        ];
    }

    removeCompleted() {
        this.state.todos = this.state.todos.filter(t => !t.complete);
    }

    async loadFromServer() {
        const result = await fetch("/todos");
        const todos = await result.json();
        this.assignTodos(todos);
    }

    assignTodos(todos: Todo[]) {
        this.state.todos = todos;
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
        
            <button onclick='(${() => store.dispatch.removeCompleted()})();'>
                remove completed
            </button>
        
            <ol>
                ${store.state.todos!.map(t => {
                    return `<li class='${t.complete ? "completed" : ""}'>${t.description}</li>`}).join("")
                }
            </ol>
        </div>
        `;
};

store.select()
    .subscribe(() => {
        renderApp();
    });
