# Tutorial

Tydux consists of three building blocks:

- State class (one per store): represents the state
- Mutators class (one per store): modify the state
- Store class (unlimited): combines one state class and one mutator class 

The following example shows a simple "TODO app".

## State 

Normal classes are used to represent the state of the application. To implement the state in our app, we need a `TodoState` class. The `TodoState` class contains all the state, modelled as normal class properties, that we want to manage with Tydux.

```
export class TodoState {

    todos: string[] = [
        "todo 1",
        "todo 2"
    ];

}
```

## Mutators

Only mutators are able to modify the state. Tydux enforces this by deeply freezing (`Object.freeze`) the state. The following mutator class contains one method to add a new todo:

```
export class TodoMutators extends Mutators<TodoState> {

    clearTodos() {
        this.state.todos = [];
    }

    addTodo(todo: string) {
        this.state.todos = [
            ...this.state.todos,
            todo
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

**Rules:**

- If a mutator throws an exception, all changes to the state will be discarded.
- Mutators can invoke other mutator methods. Their executions are merged and get treated as if only one mutator method was called.
- Mutators must not return a value. 


## Store

The store class encapsulates the state and the mutator class:

```
export class TodoStore extends Store<TodoMutators, TodoState> {

    constructor() {
        super("todo", new TodoMutators(), new TodoState());
    }

    addTodo(todo: string) {
        if (todo.trim().length === 0) {
            throw new Error("TODO must not be empty");
        }

        this.dispatch.addTodo(todo); // access the mutator
    }

    clearTodos = this.dispatch.clearTodos; // simple delegate to the mutaotr

}
```

### Constructor 

The `super()` call registers the store globally and the first parameter (here `"todo"`) must be unique. The second parameter is the mutators instance. The third parameter provides the initial state.


### Modify the state

Because the store encapsulates the mutator class, you must provide methods that provide an API and wrap or use the mutator methods. The mutator instance is available via the protected member variable `this.dispatch`. To modify the state, you simply invoke its methods:

```
this.dispatch.addTodo("new todo");
```

**Guidelines:**

- Provide the store's API via the store's public methods
- Distinguish between public and private by adding the modifier accordingly
- Use the store's method to provide a *coarse-grained* API
    - use cases, UI actions, etc.
    - asynchronous code (see below)
- Use the mutators's method to provide a *fine-grained* API
    - reusable logic to modify the state
  

### Create the store

You can directly instantiate the store (or use dependency injection to do so):

```
const store = new TodoStore();
```


### Access/query state

The current state can directly be accessed via the store member `state: Readonly<S>`: 

```
const first: Todo = store.state.todos[0];
```

In order to get called on future state changes, you need to subscribe the store:

```
store.select()
    .unbounded()
    .subscribe(store => {
        // handle change
    });
```

The `select()` methods takes an optional selector to filter and reduce the state:

```
store.select(s => s.todos)
    .unbounded()
    .subscribe(todos => {
        // handle change
    });
```

**Important:** If you pass a selector, the `Observable` will only emit new values if the selected value (here `s.todos`) changes. Since Tydux enforces immutability, this will automatically always be the case if a mutator changes the relevant part of the state. 




