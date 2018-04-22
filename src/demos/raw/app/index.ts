import "rxjs/add/operator/first";
import {enableTyduxDevelopmentMode} from "../../../development";
import {Mutator} from "../../../mutator";
import {Store} from "../../../Store";
import "./index.html";


enableTyduxDevelopmentMode();

interface Todo {
    name: string;
}

class TodoState {

    todos: Todo[] = [
        {name: "todo1"},
        {name: "todo2"},
    ];

}


class TodoMutators extends Mutator<TodoState> {

    clearTodos() {
        this.state.todos = [];
    }

    setTodos(todos: Todo[]) {
        this.state.todos = todos;
    }

    addTodoToList(todo: Todo) {
        this.state.todos = [
            ...this.state.todos,
            todo
        ];
    }

}

class TodoStore extends Store<TodoMutators, TodoState> {

    constructor() {
        super("todos", new TodoMutators(), new TodoState());
        this.addTodo("Todo 1");
        this.addTodo("Todo 2");
    }

    addTodo(name: string) {
        if (name.trim().length === 0) {
            throw new Error("TODO must not be empty");
        }

        this.mutate.addTodoToList({name: name});
    }

    clearTodos() {
        this.mutate.clearTodos();
    }

    async loadTodos() {
        this.mutate.clearTodos();
        const response = await fetch("/data.json");
        let todos: Todo[] = await response.json();
        this.mutate.setTodos(todos);
    }
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
        
            <button onclick='(${() => store.loadTodos()})();'>
                Load Todos
            </button>
        
            <ol>
                ${store.state.todos!.map(t => {
        return `<li class=''>${t.name}</li>`;
    }).join("") }
            </ol>
        </div>
        `;
};

store.unbounded().select()
    .subscribe(() => {
        renderApp();
    });
