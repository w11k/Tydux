import { AsyncPipe } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { TodoService } from '../core/todo.service';
import { ToDo } from '../core/todo.entity';
import { TodoListComponent } from '../todo-list/todo-list.component';

@Component({
  selector: 'foo-todo-list-context',
  standalone: true,
  imports: [AsyncPipe, TodoListComponent],
  template: `
    <h2>
    Todos
    @if (loading$ | async) {
      <span class="loading-message">Loading...</span>
    }
</h2>
@if (todos$ | async; as todos) {
  <foo-todo-list [todos]="todos" (todoClicked)="updateTodo($event)" />
}
  `,
  styles: [
    `.loading-message {
      font-size: 0.75em;
      color: grey;
  }
  `
  ]
})
export class TodoListContextComponent implements OnInit {
  private readonly todoService = inject(TodoService);

  todos$ = this.todoService.select(it => it.todos);
  loading$ = this.todoService.select(it => it.loading);

  ngOnInit() {
    this.todoService.loadAllTodos(1);
  }

  updateTodo($event: ToDo) {
    this.todoService.updateTodo($event);
  }

}
