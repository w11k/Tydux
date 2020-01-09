import {Component, OnDestroy, OnInit} from "@angular/core";
import {untilComponentDestroyed} from "@w11k/ngx-componentdestroyed";
import {skipNil} from "@w11k/rx-ninja";
import {ToDo} from "../core/todo.entity";
import {TodoService} from "../core/todo.service";

@Component({
    selector: "app-todo-list-context",
    templateUrl: "./todo-list-context.component.html",
    styleUrls: ["./todo-list-context.component.scss"]
})
export class TodoListContextComponent implements OnInit, OnDestroy {

    todos: ToDo[] = [];

  constructor(private readonly todoService: TodoService) {
  }

  ngOnInit() {
      this.todoService.select(it => it.todos).pipe(
          skipNil,
          untilComponentDestroyed(this)
      ).subscribe(it => {
          this.todos = it
      });
  }

  ngOnDestroy(): void {
  }

  updateTodo($event: ToDo) {
    this.todoService.toggleDoneStateOf($event);
  }
}
