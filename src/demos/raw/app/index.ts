import {enableDevelopmentMode} from "../../../devTools";
import {Mutators, Store} from "../../../Store";
import "./index.html";

import "rxjs/add/operator/first";


enableDevelopmentMode();

export class Todo {
    constructor(public description: string,
                public complete: boolean = false) {
    }
}

export class TodoState {

    filter = "";

    fredi: string | null = null;

    todos: Todo[] = [
        new Todo("todo 1", true),
        new Todo("todo 2")
    ];

}

export class TodoMutators extends Mutators<TodoState> {

    addTodo(todoName: string) {
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


store.selectNonNil(s => s.fredi)
        .subscribe(fredi => {
            fredi.substring(0, 1);
        });


(window as any).store = store;

const renderApp = () => {
    document.body.innerHTML = `
        <div>
            <button onclick='(${() => store.dispatch.addTodo("" + Date.now())})();'>
                Add Todo
            </button>
        
            <button onclick='(${() => store.dispatch.removeCompleted()})();'>
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
        .first()
        .subscribe((s) => {
            renderApp();
        });
