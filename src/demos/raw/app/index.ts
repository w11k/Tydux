/*
import "rxjs/add/operator/first";
import {enableDevToolsForStore} from "../../../dev-tools";
import {enableTyduxDevelopmentMode} from "../../../development";
import {StateMutators, Store} from "../../../Store";
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


class TodoStateGroup extends StateMutators<TodoState> {

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

const rootStateGroup = {
    todos: new TodoStateGroup(new TodoState())
};

const store = new Store(rootStateGroup);
enableDevToolsForStore(store);

class TodoService {

    addTodo(name: string) {
        if (name.trim().length === 0) {
            throw new Error("TODO must not be empty");
        }

        store.mutate.todos.addTodoToList({name: name});
    }

    clearTodos() {
        store.mutate.todos.clearTodos();
    }

    async loadTodos() {
        this.clearTodos();
        const response = await fetch("/data.json");
        let todos: Todo[] = await response.json();
        store.mutate.todos.setTodos(todos);
    }
}

const todoService = new TodoService();
(window as any).todoService = todoService;

const renderApp = () => {
    document.body.innerHTML = `
        <div>
            <button onclick='(${() => todoService.clearTodos()})();'>
                Clear
            </button>
        
            <button onclick='(${() => todoService.addTodo("" + Date.now())})();'>
                Add Todo
            </button>
        
            <button onclick='(${() => todoService.loadTodos()})();'>
                Load Todos
            </button>
        
            <ol>
                ${store.state.todos.todos.map(t => {
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
*/
