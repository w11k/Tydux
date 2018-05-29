
# Redux comparison

Property|Redux|Tydux
-|-|-
State | Arbitrary JavaScript object | Arbitrary JavaScript object, usually based on a TypeScript class <br><br> **Advantage**: Tydux **enforces** immutability, only mutators can mutate the state, no `... spread syntax` for top-level state members required, Tydux takes care to merge the state changes  
Store | created with `createStore` | TypeScript class, contains "actions" as methods which delegate to mutators ("reducer") to modify the state
Action | String constants: <br> `const ADD_TODO = 'ADD_TODO';` | The Store's methods: <br> `addTodo(todoName: string)` <br><br> **Advantage**: explicit parameters 
Action Dispatch | `store.dispatch({ type: 'ADD_TODO', text: 'My TODO' })`    | Simple method invocation: <br> `store.addTodo("My TODO")` <br><br> **Advantage**: code completion, better refactoring, better code navigation
Reducer | Unstructured code blocks <br> `state.concat([{ text: action.text }])` | Mutator class with methods <br>`appendTodo(todoName: string) {this.state.push(todoName)}` <br><br> **Advantage**: better code navigation, better stack traces, enforced immutable state object
Connecting reducers to dispatched actions | `switch` or `if` statements, structure by convention | Simple method invocation from store method to a mutator method: <br> `this.mutate.appendTodo(todoName)` <br><br> **Advantage**: code completion, better stack traces
Subscribing state changes | `store.subscribe(s => console.log(s))` | `store.select().unbounded().subscribe(s => console.log(s))` <br><br> *or* <br><br> `store.subscribe(s => console.log(s))` | `store.select().bounded(context).subscribe(s => console.log(s))` <br><br> **Advantage**: Enforced subscription management to avoid memory leaks

