import {Component} from '@angular/core';
import { TodoListContextComponent } from './todo-list-context/todo-list-context.component';

@Component({
  selector: 'foo-root',
  imports: [TodoListContextComponent],
  template: `
<h1>Tydux Demo</h1>
<div>
<foo-todo-list-context></foo-todo-list-context>
</div>


  `,
  styles: [],
  standalone: true
})
export class AppComponent {
  title = 'tydux-demo';
}
