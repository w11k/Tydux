import { Injectable } from '@angular/core';
import { ToDo } from './todo.entity';
import { Commands, Facade, TyduxStore } from '@w11k/tydux';

@Injectable({
  providedIn: 'root'
})
export class TodoService extends Facade<TodoState, TodoCommands>{

  constructor(tydux: TyduxStore) {
    super(tydux, 'todos', new TodoCommands(), new TodoState())
  }

  async toggleDoneStateOf(t: ToDo): Promise<void> {
    await this.callServer();
    this.commands.toggleToDo(t.name);
  }

  private async callServer(): Promise<void> {
    await new Promise(resolve => {
      //simulate server
      setTimeout(() => {resolve()}, 100)
    });
  }

}

export class TodoCommands extends Commands<TodoState>{
  toggleToDo(name: string) {
    this.state.todos = this.state.todos.map(it => it.name === name ? {...it, isDone: !it.isDone} : it)
  }
}

export class TodoState {
  todos: ToDo[] = [
    {isDone: false, name: 'learn Angular'},
    {isDone: true, name: 'learn Angular JS'},
    {isDone: true, name: 'cleanup tutorial'},
  ]
}
