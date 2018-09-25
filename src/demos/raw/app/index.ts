import {enableTyduxDevelopmentMode} from "../../../development";
import {Middleware} from "../../../middleware";
import {Commands} from "../../../commands";
import {ProcessedAction, Fassade} from "../../../Fassade";
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


class TodoMutators extends Commands<TodoState> {

    clearTodos() {
        this.state.todos = [];
    }

    setTodos(todos: Todo[]) {
        this.state.todos = todos;
    }

    addTodoToList(todo: Todo) {
        console.log("addTodoToList", todo);
        this.state.todos = [
            ...this.state.todos,
            todo
        ];
    }

}

class TodoStore extends Fassade<TodoMutators, TodoState> {

    constructor() {
        super("todos", new TodoMutators(), new TodoState());
        // this.addTodo("Todo 1");
        // this.addTodo("Todo 2");
    }

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

const store: TodoStore = new TodoStore();

class MyMiddlewareMutator extends Commands<TodoState> {
    addRandomTodo(prefix = "mutator-") {
        this.state.todos = [
            ...this.state.todos,
            {name: prefix + Math.random()}
        ];
    }
}

class MyMiddleware extends Middleware<TodoState, MyMiddlewareMutator, TodoStore> {

    private firstCall = true;

    getName() {
        return "MyMiddleware";
    }

    getMutator() {
        return new MyMiddlewareMutator();
    }

    afterActionProcessed(processedAction: ProcessedAction<TodoState>): void {
        console.log("afterActionProcessed", processedAction.mutatorAction);
        if (this.firstCall) {
            setTimeout(() => {
                console.log("calling mutatorDispatcher");
                this.mutatorDispatcher(processedAction.mutatorAction);
            }, 2000);
        }


        // this.mutate.addRandomTodo();

        this.firstCall = false;
    }

}

store.installMiddleware(new MyMiddleware());


(window as any).store = store;

const renderApp = () => {
    document.body.innerHTML = `
        <div>
            <button onclick="store.clearTodos()">
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

store.select()
    .unbounded()
    .subscribe(() => {
        renderApp();
    });

setTimeout(() => store.addTodo("test"), 500);
