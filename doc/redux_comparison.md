
# Redux comparison

Property|Redux|Tydux
---|---|---
State | Arbitrary JavaScript object | Arbitrary JavaScript object, usually based on a TypeScript class <br><br> **Advantage**: Tydux **enforces** immutability, only commands can mutate the state, no `... spread syntax` for top-level state members required, Tydux takes care to merge the state changes  
Store | single global store, no separation | multiple facades, encapsulation of state and mutation
Action | String constants: <br> `const ADD_TODO = 'ADD_TODO';` | The Store's methods: <br> `addTodo(todoName: string)` <br><br> **Advantage**: explicit parameters 
Action Dispatch | `store.dispatch({ type: 'ADD_TODO', text: 'My TODO' })`    | Simple method invocation: <br> `store.addTodo("My TODO")` <br><br> **Advantage**: code completion, better refactoring, better code navigation
Reducer | Unstructured code blocks <br> `state.concat([{ text: action.text }])` | Mutator class with methods <br>`appendTodo(todoName: string) {this.state.push(todoName)}` <br><br> **Advantage**: better code navigation, better stack traces, enforced immutable state object
Connecting reducers to dispatched actions | `switch` or `if` statements, structure by convention | Simple method invocation from store method to a mutator method: <br> `this.mutate.appendTodo(todoName)` <br><br> **Advantage**: code completion, better stack traces
Subscribing state changes | Own implementation | Powered by RxJS 💪 

