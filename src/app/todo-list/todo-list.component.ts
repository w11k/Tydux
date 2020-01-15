import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ToDo } from '../core/todo.entity';

@Component({
  selector: 'app-todo-list',
  templateUrl: './todo-list.component.html',
  styleUrls: ['./todo-list.component.scss']
})
export class TodoListComponent {

  @Input() todos: ToDo[];
  @Output() todoClicked = new EventEmitter<ToDo>();

  constructor() { }

  onTodoClicked(t: ToDo) {
      this.todoClicked.emit(t);
  }
}
