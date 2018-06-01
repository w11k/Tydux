# Tutorial

Tydux consists of three building blocks:

- State class: represents the state
- Mutator class: modifies the state
- Store class: combines one state class and one mutator class

The following example shows a simple "TODO app".

# State 

Normal classes are used to represent the state of the application. To implement the state in our app, we need a `TodoState` class. The `TodoState` class contains all the state information as fields that we want to manage with Tydux.

```
export class TodoState {

    todos: string[] = [
        "todo 1",
        "todo 2"
    ];

}
```

# Mutator

Only the mutator is able to modify the state. Tydux enforces this by deeply freezing (`Object.freeze`) the state properties. The following mutator class contains two methods to alter the state:

```
export class TodoMutator extends Mutator<TodoState> {

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
- A mutator method can invoke other mutator methods. Their executions are merged and get treated as if only one mutator method was called. The Redux DevTool will only show the root mutator method as an event.
- Mutator methods must not return a value.
- Mutator methods must not access the state asynchronously (once a mutator method completes, any attempt to access the state will result in an exception)


# Store

The store class encapsulates the state and the mutator class:

```
export class TodoStore extends Store<TodoMutator, TodoState> {

    constructor() {
        super("todo", new TodoMutators(), new TodoState());
    }

    addTodo(todo: string) {
        if (todo.trim().length === 0) {
            throw new Error("TODO must not be empty");
        }

        this.mutate.addTodo(todo); // access the mutator
    }

    clearTodos = this.mutate.clearTodos; // simple delegate to the mutator

}
```

Tydux supports multiple stores, each with one state and one mutator class. Therefore a state should only contain fields/information belonging to the same topic. If you want to store more data consider to split your state and mutators and create another store.

## Constructor 

The `super()` call registers the store globally and the first parameter (here `"todo"`) must be unique. The second parameter is the mutator instance. The third parameter provides the initial state.


## Modify the state

Because the store encapsulates the mutator class, you must provide methods that provide an API and wrap or use the mutator methods. The mutator instance is available via the protected member variable `this.mutate`. To modify the state, you simply invoke its methods:

```
this.mutate.addTodo("new todo");
```

**Guidelines:**

- Provide the store's API via the store's public methods
- Distinguish between public and private by adding the modifier accordingly
- Use the store's method to provide a *coarse-grained* API
    - service layer, UI actions, etc.
    - asynchronous code (see below)
- Use the mutator's method to provide a *fine-grained* API
    - reusable logic to modify the state
    - their design should be based on the domain operations
    - avoid exposing too simple data manipulation method  
  

## Create the store

You can directly instantiate the store (or use dependency injection to do so):

```
const store = new TodoStore();
```


# Access/query state

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

**Important:** If you pass a selector, the `Observable` will only emit new values if the selected value (here `s.todos`) changes. Since Tydux enforces immutability, this will automatically always be the case if a mutator changes the relevant part of the state. If your selector returns an array or an object, Tydux checks if the entries in the array or the values of the object changed. This way you can easily select multiple values. 

## unbounded()/bounded()

The `select()` method returns an instance of `ObservableSelection` which provides 2 methods:

- `unbounded()`: returns an observable that emits values whenever the selected value changes
- `bounded(operator)`: Shorthand for `.unbounded().pipe(lift(operator))`. The operator can be used to e.g.
	- terminate the observable on certain conditions
	- post-process the event delivery for e.g. change detection 

This API inter layer was added to make the RxJS observable subscription management more explicit. We believe that frameworks returning observables via their API should assist the consumers in this regard. Forgetting to unsubscribe from observables in e.g. Angular components creates very hard to debug memory leaks. Additionally, frameworks like AngularJS version 1 require to trigger a change detection after an event was dispatched so that the UI can update accordingly. 

For Angular version >= 2 and AngularJS version 1, Tydux provides two utility methods that can be used as the operator parameter passed to `bounded(operator)`:

- `toAngularComponent(this)` 
	- terminate the observable selection when the component's `ngOnDestroy()` method gets called
- `toAngularJSScope($scope)` 
	- terminate the observable selection when the scope gets destroyed
	- wrap the event delivery in `$scope.$apply()`


# Asynchronous code

Almost all applications have asynchronous code to handle e.g. server responses. The store methods are a perfect fit to model the asynchronous logic while the mutator methods are used to synchronize the state accordingly:


```
export class TodoStore extends Store<TodoMutator, TodoState> {

    async loadTodosFromServer() {
        this.mutate.clearTodos();
        const todosPromise = await fetch("/todos");
        const todos = await result.json();
        this.mutate.assignTodosLoadedFromServer(todos);
    }
    
}
```

