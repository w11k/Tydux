import {createStore, Store} from "redux";
import {composeWithDevTools} from "redux-devtools-extension";
import {Commands} from "../../../commands";
import {enableTyduxDevelopmentMode} from "../../../development";
import {Fassade} from "../../../Fassade";
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

class TodoStore extends Fassade<TodoState, TodoCommands> {

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
const fassade: TodoStore = new TodoStore(mountPoint, "TestFassade", new TodoCommands());


(window as any).fassade = fassade;

const renderApp = () => {
    document.body.innerHTML = `
        <div>
            <button onclick="fassade.clearTodos()">
                Clear
            </button>
        
            <button onclick="fassade.addTodo('' + Date.now())">
                Add Todo
            </button>
        
            <button onclick="fassade.loadTodos()">
                Load Todos
            </button>
        
            <ol>
                ${fassade.state.todos!.map(t => {
        return `<li class=''>${t.name}</li>`;
    }).join("") }
            </ol>
        </div>
        `;
};

fassade.select()
    .unbounded()
    .subscribe(() => {
        renderApp();
    });

setTimeout(() => fassade.addTodo("test"), 500);
