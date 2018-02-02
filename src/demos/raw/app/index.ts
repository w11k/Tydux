import "rxjs/add/operator/first";
import {enableTyduxDevelopmentMode} from "../../../development";
import {Mutators} from "../../../mutators";
import {Store} from "../../../Store";
import "./index.html";


enableTyduxDevelopmentMode();

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

    clearTodos() {
        this.state.todos = [];
    }

    addTodo(todoName: string) {
        this.state.todos = [
            ...this.state.todos,
            new Todo(todoName)
        ];
    }

    setTodos(todos: Todo[]) {
        this.state.todos = todos;

        setTimeout(() => {
            this.state.todos = [];
            this.clearTodos();
        }, 1000);
    }

    removeCompleted() {
        this.setTodos(this.state.todos.filter(t => !t.complete));
    }

}

export class TodoStore extends Store<TodoMutators, TodoState> {

    addTodo = this.dispatch.addTodo;

    removeCompleted = this.dispatch.removeCompleted;

    constructor() {
        super("todos", new TodoMutators(), new TodoState());
        this.addTodo("aaa");
        this.addTodo("bbb");
    }

    async loadFromServer() {
        this.dispatch.clearTodos();
        const result = await fetch("/todos");
        const todos = await result.json();
        this.dispatch.setTodos(todos);
    }

}

const store: TodoStore = new TodoStore();


(window as any).store = store;

const renderApp = () => {
    document.body.innerHTML = `
        <div>
            <button onclick='(${() => store.addTodo("" + Date.now())})();'>
                Add Todo
            </button>
        
            <button onclick='(${() => store.removeCompleted()})();'>
                remove completed
            </button>
        
            <ol>
                ${store.state.todos!.map(t => {
        return `<li class='${t.complete ? "completed" : ""}'>${t.description}</li>`
    }).join("")
            }
            </ol>
        </div>
        `;
};

store.select()
        .unbounded()
        .subscribe(() => {
            renderApp();
        });
