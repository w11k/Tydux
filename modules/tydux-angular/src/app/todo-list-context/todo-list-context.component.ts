import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TodoService } from '../core/todo.service';
import { ToDo } from '../core/todo.entity';
import { TodoListComponent } from '../todo-list/todo-list.component';

@Component({
  selector: 'app-todo-list-context',
  standalone: true,
  imports: [CommonModule, TodoListComponent],
  template: `
    <h2>
    Todos
    <span *ngIf="loading$ | async" class="loading-message">Loading...</span>
</h2>
<app-todo-list *ngIf="todos$ | async as todos" [todos]="todos" (todoClicked)="updateTodo($event)"></app-todo-list>
  `,
  styles: [
    `.loading-message {
      font-size: 0.75em;
      color: grey;
  }
  `
  ]
})
export class TodoListContextComponent {
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
