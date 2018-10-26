
[![Build Status](https://travis-ci.org/w11k/Tydux.svg?branch=master)](https://travis-ci.org/w11k/Tydux)
[![npm version](https://badge.fury.io/js/%40w11k%2Ftydux.svg)](https://badge.fury.io/js/%40w11k%2Ftydux)

![Tydux Logo](https://raw.githubusercontent.com/w11k/Tydux/master/doc/tydux_logo.png)

# Your foreman library for writing Redux stores

Tydux is a TypeScript library to provide structure and type-safety when writing Redux stores (or other compatible frameworks). You can use Tydux as a complete wrapper around Redux or along with your existing reducers and actions.  

# How does it work?

- With Tydux you combine a group of *reducers*, *actions* and *selectors*
- Every group is encapsulated within a *fassade*
- For each *fassade* you create a *mount point* to define in which slice of your store the *fassade* should operate
- In your *fassade* you expose an API to expose *action* triggers and *selectors* 


# Key benefits

- implement "divide and conquer" 
- type safety 
- enforced immutability
- class-based API works well with Angular's dependency injection

# Example

	// store's state
    const initialState = {
        valueA: 0,
        managedByTydux: {
            valueB: 10
        }
    };

    // bootstrap Redux & Tydux
    const tyduxBridge = new TyduxReducerBridge();
    const reduxStore = createStore(tyduxBridge.createTyduxReducer(initialState));
    const tyduxStore = tyduxBridge.connectStore(reduxStore);

    type ManagedByTyduxState = { valueB: number };

    // combine actions and reducers
    class MyCommands extends Commands<ManagedByTyduxState> {
        inc(by: number) {               // action + payload
            this.state.valueB += by;    // reducer
        }
    }

    // fassade to combine commands (actions & reducers) and selectors
    class MyFassade extends Fassade<ManagedByTyduxState, MyCommands> {

        constructor(tyduxStore: TyduxStore<typeof initialState>) {
            super(tyduxStore.createRootMountPoint("managedByTydux"));
        }

        getName() {
            return "MyFassade";
        }

        protected createCommands() {
            return new MyCommands();
        }

        trigger(incBy: number) {
            this.commands.inc(incBy);
        }

        selectValueB() {
            return this.select(s => s.valueB);
        }
    }

    const myFassade = new MyFassade(tyduxStore);

    // prints:
    // 10 (start value)
    // 11 (incremented by 1)
    // 31 (incremented by 20)
    myFassade.selectValueB().unbounded().subscribe(value => {
        console.log(value);
    });

    myFassade.trigger(1);
	myFassade.trigger(20);

# Documentation

### [Installation](https://github.com/Tydux/Tydux/tree/master/doc/installation.md)
### (OUTDATED, will be updated soon) [Tutorial](https://github.com/Tydux/Tydux/tree/master/doc/tutorial.md)
### (OUTDATED, will be updated soon) [Redux Comparison](https://github.com/Tydux/Tydux/tree/master/doc/redux_comparison.md)


# Patron

❤️ [W11K - The Web Engineers](https://www.w11k.de/)

❤️ [theCodeCampus - Trainings for Angular and TypeScript](https://www.thecodecampus.de/)

