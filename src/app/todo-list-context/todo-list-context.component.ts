import { Component, OnDestroy, OnInit } from '@angular/core';
import { TodoService } from '../core/todo.service';
import { Observable } from 'rxjs';
import { ToDo } from '../core/todo.entity';
import { untilComponentDestroyed } from '@w11k/ngx-componentdestroyed';

@Component({
  selector: 'app-todo-list-context',
  templateUrl: './todo-list-context.component.html',
  styleUrls: ['./todo-list-context.component.scss']
})
export class TodoListContextComponent implements OnInit, OnDestroy {

  todos$: Observable<ToDo[]>;

  constructor(private readonly todoService: TodoService) {
  }

  ngOnInit() {
    this.todos$ = this.todoService.select(it => it.todos).pipe(
      untilComponentDestroyed(this)
    )
  }

  ngOnDestroy(): void {
  }

  updateTodo($event: ToDo) {
    console.log("$event", $event);
    this.todoService.toggleDoneStateOf($event);
  }
}
