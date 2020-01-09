import {async, ComponentFixture, TestBed} from "@angular/core/testing";
import {MockComponent} from "ng-mocks";
import {TodoService, TodoState} from "../core/todo.service";
import {TodoServiceMock} from "../core/todo.service.mock";
import {TodoListComponent} from "../todo-list/todo-list.component";

import {TodoListContextComponent} from "./todo-list-context.component";

describe("TodoListContextComponent", () => {
    let component: TodoListContextComponent;
    let fixture: ComponentFixture<TodoListContextComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [
                TodoListContextComponent,
                MockComponent(TodoListComponent)
            ],
            providers: [
                TodoServiceMock,
                {provide: TodoService, useExisting: TodoServiceMock}
            ]
        })
            .compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(TodoListContextComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    it("should update todo via service", () => {
        const mock: TodoServiceMock = TestBed.get(TodoServiceMock);
        const todoForUpdate = {name: "Test Tydux with mocked facade", description: "", isDone: true};
        component.updateTodo(todoForUpdate);
        expect(mock.lastToggleTodo).toBe(todoForUpdate);
    });

    it("should receive update via select", () => {
        const mock: TodoServiceMock = TestBed.get(TodoServiceMock);
        expect(component.todos).toEqual(new TodoState().todos);
        const emptyListState: TodoState = {todos: []};
        mock.state = emptyListState;
        expect(component.todos).toEqual([]);
    });
});
