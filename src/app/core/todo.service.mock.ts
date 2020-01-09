import {FacadeMock} from "@w11k/tydux";
import {ToDo} from "./todo.entity";
import {TodoService, TodoState} from "./todo.service";

export class TodoServiceMock extends FacadeMock<TodoState> implements Partial<TodoService> {

    lastToggleTodo: ToDo | null = null;

    constructor() {
        super(new TodoState());
    }

    async toggleDoneStateOf(todo: ToDo) {
        this.lastToggleTodo = todo;
    }
}
