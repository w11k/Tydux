[![Build Status](https://travis-ci.org/w11k/Tydux.svg?branch=master)](https://travis-ci.org/w11k/Tydux)
[![npm version](https://badge.fury.io/js/%40w11k%2Ftydux.svg)](https://badge.fury.io/js/%40w11k%2Ftydux)

![Tydux Logo](https://raw.githubusercontent.com/w11k/Tydux/master/doc/tydux_logo.png)


# Encapsulating State Management Library

Tydux is a state management library implemented in TypeScript with a strong focus on encapsulation, type safety and immutability. It can be used standalone or hook into existing Redux-based (or compatible) application.  

Tydux shares the concept of state, actions, reducer and selectors but differs in the way they are implemented. The key differences and concepts are:

- Actions and their reducers are implemented together and are called **commands**. No more action type string identifier!
- Commands are only accessible within a **facade**. 
- The facade and commands share and operate on a **state**. Only the commands can mutate the state while the facade provides read-only access to the state as well as coarse-grained operations for consumers.
- The facade is responsible for handling async operations (e.g. HTTP calls) and uses the commands to change the state accordingly.
- Consumers of the facade can access a read-only version of the state or subscribe to state changes via an RxJS `Observable`.
- You can have as many facades as you like with each of them containing their own commands and state.


# Key benefits

- implement "divide and conquer" 
- type safety 
- enforced immutability
- class-based API works well with Angular's dependency injection


# Installation

Install Tydux, Redux and RxJS via npm `npm install @w11k/tydux redux rxjs`.


# Quick Overview Demo

Well will need at least a **state**, the **commands** and the **facade**. 

**Create the state class:**

Your can implement the state with a class or a plain JavaScript object. Classes are a bit more convenient but remember that you must not use inheritance and that the class only contains fields. 

```
export class TodoState {
  todos: ToDo[] = [
    {isDone: false, name: 'learn Angular'},
    {isDone: true, name: 'learn Angular JS'},
    {isDone: true, name: 'cleanup tutorial'},
  ]
}
```

**Create the commands:**

Commands are grouped within a class and can alter the state via `this.state`. Only the direct field members of the state object can be changed, not the attributes of nested object. 

```
export class TodoCommands extends Commands<TodoState> {
    addTodo(name: string) {
        this.state.todos = [
            {isDone: false, name},
            ...this.state
        ];
    }
    
    toggleTodo(name: string) {
        this.state.todos = this.state.todos.map(
            it => it.name === name ? {...it, isDone: !it.isDone} : it
        )
    }
}
```

**Create the facade:**

After we created the state and commands, we combine them within a facade.

```
export class TodoFacade extends Facade<TodoState, TodoCommands> {

  constructor(tydux: TyduxStore) {
    super(tydux, 'todos', new TodoCommands(), new TodoState())
  }

  //in our store we can do synchronous or asynchronous stuff (action or effect)
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
```

# Documentation

### [Angular integration](https://github.com/w11k/Tydux/tree/master/doc/angular.md)
### [Migration guide version 8 -> 9](https://github.com/w11k/Tydux/tree/master/doc/migration_8_9.md)


# Patron

❤️ [W11K - The Web Engineers](https://www.w11k.de/)

❤️ [theCodeCampus - Trainings for Angular and TypeScript](https://www.thecodecampus.de/)
