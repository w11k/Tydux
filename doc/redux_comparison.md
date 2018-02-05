
# Redux comparison

Property|Redux|Tydux
-|-|-
State | Arbitrary JavaScript object | TypeScript class 
Store | created with `createStore` | TypeScript class, contains "actions" as methods which delegate to mutators ("reducer") to modify the state
Action | String constants: <br> `const ADD_TODO = 'ADD_TODO';` | The Store's methods: <br> `addTodo(todoName: string)` <br><br> **Advantage**: explicit parameters 
Action Dispatch | `store.dispatch({ type: 'ADD_TODO', text: 'My TODO' })`    | Simple method invocation: <br> `store.addTodo("My TODO")` <br><br> **Advantage**: code completion, better refactoring, better code navigation
Reducer | Unstructured code blocks <br> `state.concat([{ text: action.text }])` | Mutator class with methods <br>`appendTodo(todoName: string) {this.state.push(todoName)}` <br><br> **Advantage**: better code navigation, better stack traces, enforced immutable state object
Connecting reducers to dispatched actions | `switch` or `if` statements, structure by convention | Simple method invocation from store method to a mutator method: <br> `this.mutate.appendTodo(todoName)` <br><br> **Advantage**: code completion, better stack traces
