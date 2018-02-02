import "rxjs/add/operator/first";
import {enableTyduxDevelopmentMode} from "../../../development";
import {Mutators} from "../../../mutators";
import {Store} from "../../../Store";
import "./index.html";


enableTyduxDevelopmentMode();

export class TodoState {

    todos: string[] = [
        "todo 1",
        "todo 2"
    ];

}

export class TodoMutators extends Mutators<TodoState> {

    clearTodos() {
        this.state.todos = [];
    }

    addTodo(todo: string) {
        this.state.todos = [
            ...this.state.todos,
            todo
        ];
    }

}

export class TodoStore extends Store<TodoMutators, TodoState> {

    constructor() {
        super("todos", new TodoMutators(), new TodoState());
        this.addTodo("aaa");
        this.addTodo("bbb");
    }

    addTodo(todo: string) {
        if (todo.trim().length === 0) {
            throw new Error("TODO must not be empty");
        }

        this.dispatch.addTodo(todo);
    }

    clearTodos = this.dispatch.clearTodos;

}

const store: TodoStore = new TodoStore();


(window as any).store = store;

const renderApp = () => {
    document.body.innerHTML = `
        <div>
            <button onclick='(${() => store.clearTodos()})();'>
                Clear
            </button>
        
            <button onclick='(${() => store.addTodo("" + Date.now())})();'>
                Add Todo
            </button>
        
            <ol>
                ${store.state.todos!.map(t => {
        return `<li class=''>${t}</li>`
    }).join("") }
            </ol>
        </div>
        `;
};

store.select()
    .unbounded()
    .subscribe(() => {
        renderApp();
    });
