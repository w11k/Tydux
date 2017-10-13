# Tutorial

Tydux consists of three building blocks:

- State class (one per store): represents the state
- Mutators class (one per store): modify the state
- Store class (unlimited): combines one state class and one mutator class 

The following example shows a simple "TODO app".

## State 

Normal classes are used to represent the state of the application. To implement the state in our app, we need a `Todo` and a `TodoState` class. However, only the latter is relevant for Tydux. The former simply serves for demonstration purposes.

The `TodoState` class contains all the state, modelled as normal class properties, that we want to manage with Tydux.

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

If a mutator throws an exception, all changes to the state will be discarded.

Mutators can invoke other mutator methods. Their executions are merged and get treated as if only one mutator method was called.

### Asynchronous mutators

Almost all applications have asynchronous code to handle e.g. server responses. While mutators can *initiate* async operations, they are not allowed to access the state (via `this.state`) in an async callback. 

**Important:** Once the mutator method completes, any attempt to access the state will result in an exception!

 The solution is to delegate the processing of the async result in *another mutator method*. The following mutator class contains two methods. `loadFromServer()` initiates an async operation und uses `assignTodos()` to handle the response:

```
export class TodoMutators extends Mutators<TodoState> {

    async loadFromServer() {
        this.state.timestampLoadRequested = Date.now();     // valid state access
        const result = await fetch("/todos");               // async starts here...
        const todos = await result.json();
        this.assignTodos(todos);                            // ... delegate to other mutator
    }

    assignTodos(todos: Todo[]) {
        this.state.todos = todos;                           // valid state access
    }

}
```


## Store

The store class combines the state and the mutators:

```
export class TodoStore extends Store<TodoMutators, TodoState> {
    constructor() {
        super("todo", new TodoMutators(), new TodoState());
    }
}
```

The `super()` call registers the store globally and the first parameter (here `"todo"`) must be unique. The second parameter is the mutators instance. If you use e.g. [Angular](https://angular.io) or any other framework with dependency injection, it usually makes sense to provide/configure the store and mutator classes with the injector. The third parameter provides the initial state.

You can directly instantiate the store (or use dependency injection):

```
const store = new TodoStore();
```

### Modify state

To modify the state, you simply invoke the mutator methods. This must be done via the store instance:

```
store.dispatch.addTodo("new todo");
```

### Access/query state

The current state can directly be accessed via the store instance:

```
const first: Todo = store.state.todos[0];
```

In order to get called on future state changes, you need to subscribe the store:

```
store.select()
    .subscribe(store => {
        // handle change
    });
```

The `select()` methods returns a RxJS `Observable` and takes an optional selector to filter and reduce the state:

```
store.select(s => s.todos)
    .subscribe(todos => {
        // handle change
    });
```

**Important:** If you pass a selector, the `Observable` will only emit new values if the selected value (here `s.todos`) changes. Since Tydux enforces immutability, this will automatically always be the case if a mutator changes the relevant part of the state. 




