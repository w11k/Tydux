
[![Build Status](https://travis-ci.org/w11k/Tydux.svg?branch=master)](https://travis-ci.org/w11k/Tydux)
[![npm version](https://badge.fury.io/js/%40w11k%2Ftydux.svg)](https://badge.fury.io/js/%40w11k%2Ftydux)

![Tydux Logo](https://raw.githubusercontent.com/w11k/Tydux/master/doc/tydux_logo.png)

# Tydux

**Your foreman library for writing Redux stores**

Tydux is a TypeScript library to provide structure and type-safety when writing Redux stores (or other compatible frameworks). You can use Tydux as a complete wrapper around Redux or along with your existing reducers and actions.  

# How does it work?

- With Tydux you can combine a group of *reducers*, *actions* and *selectors*
- Every group is encapsulated within a *fassade*
- For each *fassade* you create a *mount point* to define in which slice of your store the *fassade* should operate.
- In your *fassade* you expose an API which can be used to trigger actions 


# Key benefits and philosophy

- state management with enforced immutability
- focus on code scalability
- utilizes pure TypeScript classes

# Example

        const initialState = {
            valueA: 0,
            managedByTydux: {
                valueB: 10
            }
        };

        const tyduxBridge = new TyduxStoreBridge();
        const reduxStore = createStore(tyduxBridge.createTyduxReducer(initialState));
        const tyduxStore = tyduxBridge.connectStore(reduxStore);

        type ManagedByTyduxState = {valueB: number};

        class MyCommands extends Commands<ManagedByTyduxState> {
            inc(by: number) {
                this.state.valueB += by;
            }
        }

        class MyFassade extends Fassade<ManagedByTyduxState, MyCommands> {

            constructor(tyduxStore: TyduxStore<typeof initialState>) {
                super(tyduxStore.createRootMountPoint("managedByTydux"));
            }

            getName() {
                return "MyFassade";
            }

            createCommands() {
                return new MyCommands();
            }

            action() {
                this.commands.inc(100);
            }
        }

        const myFassade = new MyFassade(tyduxStore);
        myFassade.action();

# Documentation

### [Installation](https://github.com/Tydux/Tydux/tree/master/doc/installation.md)
### [Tutorial](https://github.com/Tydux/Tydux/tree/master/doc/tutorial.md)
### [Redux Comparison](https://github.com/Tydux/Tydux/tree/master/doc/redux_comparison.md)
### [Redux DevTools](https://github.com/Tydux/Tydux/tree/master/doc/redux-devtools.md)


# Patron

❤️ [W11K - The Web Engineers](https://www.w11k.de/)

❤️ [theCodeCampus - Trainings for Angular and TypeScript](https://www.thecodecampus.de/)

