
[![Build Status](https://travis-ci.org/w11k/Tydux.svg?branch=master)](https://travis-ci.org/w11k/Tydux)
[![npm version](https://badge.fury.io/js/%40w11k%2Ftydux.svg)](https://badge.fury.io/js/%40w11k%2Ftydux)

![Tydux Logo](https://raw.githubusercontent.com/w11k/Tydux/master/doc/tydux_logo.png)

# Tydux

Tydux is a TypeScript library for predictable state management. It follows the [command-query separation pattern](https://en.wikipedia.org/wiki/Command%E2%80%93query_separation) and was heavily influenced by [Redux](https://github.com/reactjs/redux). It is designed to be used in applications written in TypeScript, but normal ECMAScript classes also work.

Other than Redux, it utilizes **types to structure the code** and **enforces immutability**.

# Key benefits and philosophy

- state management with enforced immutability
- focus on code scalability
- instance based store to perfectly support e.g. Angular's [hierarchical dependency injectors](https://angular.io/guide/hierarchical-dependency-injection)
- utilizes pure TypeScript classes

# Example

    class MyState {
        stateNumber = 0;
    }

    class MyMutators extends Mutators<MyState> {
        increment() {
            this.state.stateNumber++;
        }
        decrement() {
            this.state.stateNumber--;
        }
    }

    class MyStore extends Store<MyMutators, MyState> {
        constructor() {
            super("myStore", new MyMutators(), new MyState());
        }
        
        rollTheDice() {
            if (Math.random() > 0.5) {
                this.mutate.increment();
            } else {
                this.mutate.decrement();
            }
        }
    }

    const store = new MyStore();

    // directly query the state
    console.log("query", store.state.stateNumber);

    // observe the state
    store.select(s => s.stateNumber).unbounded().subscribe(count => {
        console.log("observe", count);
    });

    // dispatch actions
    store.rollTheDice();

# Documentation

### [Installation](https://github.com/Tydux/Tydux/tree/master/doc/installation.md)
### [Tutorial](https://github.com/Tydux/Tydux/tree/master/doc/tutorial.md)
### [Redux Comparison](https://github.com/Tydux/Tydux/tree/master/doc/redux_comparison.md)
### [Mutator Hooks](https://github.com/Tydux/Tydux/tree/master/doc/mutators-hooks.md)
### [Redux DevTools](https://github.com/Tydux/Tydux/tree/master/doc/redux-devtools.md)

