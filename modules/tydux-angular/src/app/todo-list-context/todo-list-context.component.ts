import {Component, OnDestroy, OnInit} from "@angular/core";
import {ToDo} from "../core/todo.entity";
import {TodoService} from "../core/todo.service";

@Component({
    selector: "app-todo-list-context",
    templateUrl: "./todo-list-context.component.html",
    styleUrls: ["./todo-list-context.component.scss"]
})
export class TodoListContextComponent implements OnInit, OnDestroy {

    todos$ = this.todoService.select(it => it.todos);
    loading$ = this.todoService.select(it => it.loading);

    constructor(private readonly todoService: TodoService) {
    }

    ngOnInit() {
        this.todoService.loadAllTodos(1);
    }

    ngOnDestroy(): void {
    }

    updateTodo($event: ToDo) {
        this.todoService.updateTodo($event);
    }
}
