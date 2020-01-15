import {Injectable} from "@angular/core";
import {Commands, Facade, TyduxStore} from "@w11k/tydux";
import {ToDo} from "./todo.entity";

@Injectable({
    providedIn: "root"
})
export class TodoService extends Facade<TodoState, TodoCommands> {

    constructor(tydux: TyduxStore) {
        super(tydux, "todos", new TodoCommands(), new TodoState());
    }

    async loadAllTodos(userId: number) {
        this.commands.loadingOn();

        try {
            const req = await fetch(`https://jsonplaceholder.typicode.com/todos?userId=${userId}`);
            const todos = await req.json();
            this.commands.setTodos(todos);
        } finally {
            this.commands.loadingOff();
        }

    }

    async updateTodo(todo: ToDo): Promise<void> {
        this.commands.loadingOn();
        this.commands.updateTodo(todo.id);

        try {
            await fetch(`https://jsonplaceholder.typicode.com/posts/${todo.id}`, {
                method: "PUT",
                body: JSON.stringify(todo),
            });
        } finally {
            this.commands.loadingOff();
        }
    }

}

export class TodoCommands extends Commands<TodoState> {

    loadingOn() {
        this.state.loading = true;
    }

    loadingOff() {
        this.state.loading = false;
    }

    setTodos(todos: ToDo[]) {
        this.state.todos = todos;
    }

    updateTodo(id: number) {
        this.state.todos = this.state.todos.map(it => it.id === id ? {
            ...it,
            completed: !it.completed
        } : it);
    }
}

export class TodoState {
    loading = false;
    todos: ToDo[] = [];
}
