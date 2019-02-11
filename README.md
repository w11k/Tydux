[![Build Status](https://travis-ci.org/w11k/Tydux.svg?branch=master)](https://travis-ci.org/w11k/Tydux)
[![npm version](https://badge.fury.io/js/%40w11k%2Ftydux.svg)](https://badge.fury.io/js/%40w11k%2Ftydux)

![Tydux Logo](https://raw.githubusercontent.com/w11k/Tydux/master/doc/tydux_logo.png)

# Your foreman library for writing Redux stores

Tydux is a TypeScript library to provide structure and type-safety when writing Redux stores (or other compatible frameworks). You can use Tydux as a complete wrapper around Redux or along with your existing reducers and actions.  

# How does it work?

- With Tydux you combine a group of *reducers*, *actions* and *selectors*
- Every group is encapsulated within a *facade*
- For each *facade* you create a *mount point* to define in which slice of your store the *facade* should operate
- In your *facade* you expose an API to expose *action* triggers and *selectors* 


# Key benefits

- implement "divide and conquer" 
- type safety 
- enforced immutability
- class-based API works well with Angular's dependency injection

## Installation

### tydux
Install via npm `npm install @w11k/tydux`. Note that dependencies are only declared as peer dependencies.
So make sure that you have installed `redux: 4.x.x` and `rxjs: >= 6.2.0` in your project. 
You could for example throw in `redux-devtools-extension`.

### tydux-angular
Install tydux (see above) and install tydux-anguar per npm `npm install @w11k/tydux-angular`.

## Getting startet

### tydux
Create your initial state 
```typescript
export class TodoState {
  todos: ToDo[] = [
    {isDone: false, name: 'learn Angular'},
    {isDone: true, name: 'learn Angular JS'},
    {isDone: true, name: 'cleanup tutorial'},
  ]
}
```

Then setup your commands to calculate and update your state. Note that all objects in your
state are frozen and can't be altered. So we generate new objects instead of altering.

```typescript
export class TodoCommands extends Commands<TodoState>{
  toggleToDo(name: string) {
    this.state.todos = this.state.todos.map(
      it => it.name === name ? {...it, isDone: !it.isDone} : it
    )
  }
}
```

We have now our state and our commands to temper with the state. Now we combine those two
in our facade

```typescript
export class TodoStore extends Facade<TodoState, TodoCommands>{

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

### tydux-angular
To integrate tydux into angular just create a factory function for your tydux config and import
the `TyduxModule` into your `AppModule`

```typescript
export function createTyduxConfig(): TyduxConfiguration {
  return {
    storeEnhancer: environment.production ? undefined : composeWithDevTools(),
    developmentMode: !environment.production
  };
}

@NgModule({
imports: [
  TyduxModule.forRoot(createTyduxConfig)
]
})
export class AppModule{}
```
