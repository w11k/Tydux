
# Redux comparison

Property|Redux|Tydux
-|-|-
Action | String constants <br> `const ADD_TODO = 'ADD_TODO';` | The Store's methods <br> `addTodo(todoName: string)` <br> Advantages: explicit parameters 
Action Dispatch | `store.dispatch({ type: 'ADD_TODO', text: 'My TODO' })`    | Simple method invocation <br> `store.addTodo("My TODO")` <br> Advantages: code completion, better refactoring, better code navigation




