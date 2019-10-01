[![Build Status](https://travis-ci.org/w11k/Tydux.svg?branch=master)](https://travis-ci.org/w11k/Tydux)
[![npm version](https://badge.fury.io/js/%40w11k%2Ftydux.svg)](https://badge.fury.io/js/%40w11k%2Ftydux)

![Tydux Logo](https://raw.githubusercontent.com/w11k/Tydux/master/doc/tydux_logo.png)


# Encapsulating State Management Library

Tydux is a state management library implemented in TypeScript with a strong focus on encapsulation, type safety and immutability. It can be used standalone or hook into existing Redux-based (or compatible) application.  

**The key concepts are:**

- You define your **state** in designated classes or objects. 
- Only **commands** are allowed to alter the state. Commands are implemented as classes with methods. Every method defines a valid state transition. Hence, only commands are responsible for the state manipulation.
- Commands are only accessible within a **facade**. The facade provides the initial state, a read-only access to the state and a stream to subscribe state changes.
- While commands provide fine-grained methods for state manipulation, the facades provide more coarse-grained methods. For example, a facade could provide a method to load a todo list from the server. To do so, the facade method would 1. use a command method to clear the current state, 2. load the list from the server and 3. use a command method to update the state with the received list.
- The facade is responsible for handling async operations (e.g. HTTP calls) and uses the commands to change the state accordingly.
- Consumers of the facade can access a read-only version of the state or subscribe to state changes via an RxJS `Observable`.
- You can have as many facades as you like with each of them containing their own commands and state.

**If you know Redux:** 

Tydux shares the concept of state, actions, reducer and selectors but differs in the way they are implemented:

- Actions and their reducers are implemented together and are called **commands**. No more action type string identifier!
- Only **facades** can access commands
- A facade provides a read-only stream of state changes

**Key benefits:**

- implement "divide and conquer" 
- type safety 
- enforced immutability
- class-based API 
- ... which works well with Angular's dependency injection


# Installation

Install Tydux and all required peer-dependencies: 

`npm install @w11k/tydux redux rxjs`.


# Quick Overview Demo

Well will need at least a **state**, the **commands** and the **facade**. 

**Create the state class:**

You can implement the state with a class or a plain JavaScript object. Classes are a bit more convenient but remember that you must not use inheritance and that the class only contains fields. 

```
export class TodoState {
  todos: ToDo[] = [
    {isDone: false, name: 'learn TypeScript'},
    {isDone: true, name: 'buy milk'},
    {isDone: true, name: 'clean house'},
  ]
}
```

**Create the commands:**

Commands are grouped within a class and can alter the state via `this.state`. Only the direct field members of the state object can be changed, not the attributes of nested object. 

```
export class TodoCommands extends Commands<TodoState> {

    clear() {
        this.state.todos = [];
    }
    
    setTodoList(todos: ToDo[]) {
        this.state.todos = todos;
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
    super(tydux, 'todos', new TodoCommands(), new TodoState());
  }

  /**
   * in our facade we can do synchronous or asynchronous stuff (action or effect)
   */
  async loadTodoListFromServer() {
    this.commands.clear();
    const list = await fetch("/todos");
    this.commands.setTodoList(list);
  }
  
  /**
   * simple delegate to a command method
   */
  toggleDoneStateOf(t: ToDo) {
    this.commands.toggleToDo(t.name);
  }

}
```

**Bootstrap:**

After we created the state, commands and facade, we can bootstrap Tydux. 

1. We need to create a `TyduxStore` once and provide the global initial state. Every facade's state is part of this global state. 
2. When instantiating the facade, we need to provide the global TyduxStore instance, a name to identify the facade within the global state, the commands instance and the initial state.

```
// Use {} as initial global state
const tyduxStore = createTyduxStore({});

// instatiate every facade once
const todoFacade = new TodoFacade(tyduxStore);  
```

**Usage:**

```
// get the current state
const todos: ToDo[] = todoFacade.state.todos;

// subscribe to state changes
todoFacade.subscribe(state => {
    const todos: ToDo[] = state.todos;
});

// call facade methods
todoFacade.loadTodoListFromServer();
```

# Documentation

### [Angular integration](https://github.com/w11k/Tydux/blob/master/projects/w11k/tydux-angular/README.md)
### [Migration guide version 8 -> 9](https://github.com/w11k/Tydux/tree/master/doc/migration_8_9.md)


# Patron

❤️ [W11K - The Web Engineers](https://www.w11k.de/)

❤️ [theCodeCampus - Trainings for Angular and TypeScript](https://www.thecodecampus.de/)
