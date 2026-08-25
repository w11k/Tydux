import {FacadeMock} from "@w11k/tydux/dist/esm2015/testing";
import {ToDo} from "./todo.entity";
import {TodoService, TodoState} from "./todo.service";

export class TodoServiceMock extends FacadeMock<TodoState> implements Partial<TodoService> {

    lastUpdatedTodo: ToDo | null = null;

    constructor() {
        super(new TodoState());
    }

    loadAllTodos(): Promise<void> {
        return Promise.resolve();
    }

    updateTodo(todo: ToDo): Promise<void> {
        this.lastUpdatedTodo = todo;
        return Promise.resolve();
    }
}
