import {createStore, Store} from "redux";
import {composeWithDevTools} from "redux-devtools-extension";
import {Commands} from "../../../commands";
import {enableTyduxDevelopmentMode} from "../../../development";
import {Facade} from "../../../Facade";
import {TyduxReducerBridge} from "../../../store";
import "./index.html";
import {createTodoList} from "./mock";


enableTyduxDevelopmentMode();

export interface Todo {
    name: string;
}

class TodoState {

    todos: Todo[] = [
        {name: "todo1"},
        {name: "todo2"},
    ];

}


class TodoCommands extends Commands<TodoState> {

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

class TodoStore extends Facade<TodoState, TodoCommands> {

    addTodo(name: string) {
        if (name.trim().length === 0) {
            throw new Error("TODO must not be empty");
        }

        this.commands.addTodoToList({name: name});
    }

    clearTodos() {
        this.commands.clearTodos();
    }

    async loadTodos() {
        this.commands.clearTodos();
        const todos = await createTodoList();
        this.commands.setTodos(todos);
    }

}

const bridge = new TyduxReducerBridge();
const store: Store<TodoState> = createStore(bridge.createTyduxReducer(new TodoState()), composeWithDevTools());
const connectedBridge = bridge.connectStore(store);
const mountPoint = connectedBridge.createMountPoint(s => s, (g, l) => ({...l}));
const facade: TodoStore = new TodoStore(mountPoint, "TestFacade", new TodoCommands());


(window as any).facade = facade;

const renderApp = () => {
    document.body.innerHTML = `
        <div>
            <button onclick="facade.clearTodos()">
                Clear
            </button>
        
            <button onclick="facade.addTodo('' + Date.now())">
                Add Todo
            </button>
        
            <button onclick="facade.loadTodos()">
                Load Todos
            </button>
        
            <ol>
                ${facade.state.todos!.map(t => {
        return `<li class=''>${t.name}</li>`;
    }).join("") }
            </ol>
        </div>
        `;
};

facade.select()

    .subscribe(() => {
        renderApp();
    });

setTimeout(() => facade.addTodo("test"), 500);
