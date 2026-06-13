import { Component, input, output } from '@angular/core';
import { ToDo } from '../core/todo.entity';

@Component({
  selector: 'foo-todo-list',
  standalone: true,
  template: `
<ul>
  @for (t of todos(); track t.id) {
    <li [class.done]="t.completed">
      <label>
        <input type="checkbox" [checked]="t.completed" (input)="onTodoClicked(t)">
        {{t.title}}
      </label>
    </li>
  }
</ul>
  `,
  styles: [
    `.done {
      text-decoration: line-through;
    }`
  ]
})
export class TodoListComponent {
  readonly todos = input<readonly ToDo[]>([]);
  readonly todoClicked = output<ToDo>();

  onTodoClicked(t: ToDo) {
    this.todoClicked.emit(t);
  }
}
