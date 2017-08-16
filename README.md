[![Build Status](https://travis-ci.org/Tydux/Tydux.svg?branch=master)](https://travis-ci.org/Tydux/Tydux)

[![NPM](https://nodei.co/npm/tydux.png)](https://npmjs.org/package/tydux)

# Tydux

Tydux is a TypeScript library for predictable state management. It follows the [command-query separation pattern](https://en.wikipedia.org/wiki/Command%E2%80%93query_separation) and was heavily influenced by [Redux](https://github.com/reactjs/redux).

Other than Redux, it utilizes **types to structure the code** and **enforces immutability**.

# Howto use

Tydux consists of three building blocks:

- *State*: class that represents the state
- *Mutators*: modify the state
- *Store*: combines one *state* class and one *mutator* class 

The following example shows a simple "TODO app".

## State 

Normal classes are used to represent and store the state of the application. To implement the state in our app, we need a `Todo` and a `TodoState` class. However, only the latter is relevant for Tydux.

```
export class Todo {
    constructor(public description: string, 
                public complete: boolean = false) {
    }
}

export class TodoState {

    filter = "";

    todos: Todo[] = [
        new Todo("todo 1", true),
        new Todo("todo 2")
    ];

}
```

## Mutators

Only mutators are able to modify the state. Tydux enforces this by deeply freezing (`Object.freeze`) the state. The following mutator class contains one method to add a new todo:

```
export class TodoMutators extends Mutators<TodoState> {

    addTodo(todoName: string) {
        this.state.todos = [
            ...this.state.todos,
            new Todo(todoName)
        ];
    }

}
```

Mutators can access and change the state object via `this.state`. Only direct members can be altered. Hence, the following code is valid:

```
this.state.todos = [];
```

But this code results in an exception (`TypeError: object is not extensible`):

```
this.state.todos.push(...);
```

### Async mutators

Almost all applications have asynchronous code to handle e.g. server responses. While mutators can *initiate* async operations, they are not allowed to access the state (via `this.state`) in an async callback. 

**!!! Once the mutator method completes, any attempt to access the state will result in an exception !!!**

 The solution is to delegate the processing of the async result in *another mutator method*. The following mutator class contains two methods. `loadFromServer()` initiates an async operation und uses `assignTodos()` to handle the response:

```
export class TodoMutators extends Mutators<TodoState> {

    async loadFromServer() {
        const result = await fetch("/todos");
        const todos = await result.json();
        this.assignTodos(todos);
    }

    assignTodos(todos: Todo[]) {
        this.state.todos = todos;
    }

}
```


## Store

### Dispatch actions

### Select state

## Redux Dev Tools
