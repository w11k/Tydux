[![Build Status](https://travis-ci.org/Tydux/Tydux.svg?branch=master)](https://travis-ci.org/Tydux/Tydux)

# Tydux

Tydux is a TypeScript library for predictable state management. It follows the [command-query separation pattern](https://en.wikipedia.org/wiki/Command%E2%80%93query_separation) and was heavily influenced by [Redux](https://github.com/reactjs/redux). It is designed to be used in applications written in TypeScript, but normal ECMAScript classes also work.

Other than Redux, it utilizes **types to structure the code** and **enforces immutability**.

# Example

    class MyState {
        count = 0;
    }

    class MyMutators extends Mutators<MyState> {
        increment() {
            this.state.count++;
        }
        decrement() {
            this.state.count--;
        }
    }

    class MyStore extends Store<MyMutators, MyState> {
        constructor() {
            super("myStore", new MyMutators(), new MyState());
        }
    }

    const store = new MyStore();

    // directly query the state
    console.log("query", store.state.count);

    // observe the state
    store.select(s => s.count).subscribe(count => {
        console.log("observe", count);
    });

    // dispatch actions
    store.dispatch.increment();
    store.dispatch.decrement();
    
    // prints
    // >> query 0
    // >> observe 0
    // >> observe 1
    // >> observe 0

# Documentation

### [Installation](https://github.com/Tydux/Tydux/tree/master/doc/installation.md)
### [Tutorial](https://github.com/Tydux/Tydux/tree/master/doc/tutorial.md)
### [Modifier Hooks](https://github.com/Tydux/Tydux/tree/master/doc/modifier-hooks.md)
### [Redux DevTools](https://github.com/Tydux/Tydux/tree/master/doc/redux-devtools.md)

