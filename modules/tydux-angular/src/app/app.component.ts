import {Component, Provider} from '@angular/core';
import { TodoListContextComponent } from './todo-list-context/todo-list-context.component';
import {TyduxStore} from "@w11k/tydux";

@Component({
  selector: 'app-root',
  imports: [TodoListContextComponent],
  template: `
<h1>Tydux Demo</h1>
<div>
<app-todo-list-context></app-todo-list-context>
</div>


  `,
  styles: [],
  standalone: true
})
export class AppComponent {
  title = 'tydux-demo';
  constructor() {
  }

}
