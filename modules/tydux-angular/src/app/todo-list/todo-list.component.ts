import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToDo } from '../core/todo.entity';

@Component({
  selector: 'app-todo-list',
  standalone: true,
  imports: [CommonModule],
  template: `
<ul>
  <li *ngFor="let t of todos" [class.done]="t.completed">
    <label>
      <input type="checkbox" [checked]="t.completed" (input)="onTodoClicked(t)">
      {{t.title}}
    </label>
  </li>
</ul>
  `,
  styles: [
    `.done {
      text-decoration: line-through;
    }`
  ]
})
export class TodoListComponent {
  @Input() todos: ToDo[] = [];
  @Output() todoClicked = new EventEmitter<ToDo>();

  constructor() { }

  onTodoClicked(t: ToDo) {
    this.todoClicked.emit(t);
  }
}
