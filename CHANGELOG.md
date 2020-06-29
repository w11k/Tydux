# Version 14.4.0

- added groupById

# Version 14.3.0

- added groupByUniqueId

# Version 14.2.0

- added FacadeMock test util

# Version 14.1.2

- improved error message when a global store is already registered


# Version 14.1.1

- version bump @w11k/rx-ninja to ^4.1.0


# Version 14.1.0

- TyduxModule.forRoot*() configuration now accepts an environment property to simplify development mode configuration 

# Version 14.0.0

**BREAKING CHANGE**

https://github.com/w11k/Tydux/tree/master/doc/migration_14.md

- the generic state type parameter is now optional and comes last (if specified)
- added several command utils

# Version 13.5.7

- fixed peer of tydux-angular

# Version 13.5.6

- alpha: WIP mutators

# Version 13.5.5

- alpha: mutators

# Version 13.5.3

- added orderedMapPatchEntities

# Version 13.5.2

- changed OrderedMapFacade to command mutator
- assignFieldCommand -> createAssignFieldCommand

# Version 13.5.0

- added mutator: assignFieldCommand

# Version 13.4.0

- added OrderedMapFacade#getById

# Version 13.3.0

- added selectNonNil method to facade
- facade methods are now pulled up to the instance to ease using them as callbacks
- child facades are now destroyed when the parent facade gets destroyed

# Version 13.2.3

- changes to OrderedMapFacade

# Version 13.2.2

- fixed wrong release

# Version 13.1.0

- added first POC for RepositoryFacade

# Version 13.0.0

- simplified facade creation
- added global store feature

**BREAKING CHANGE**

- Facade constructor:
    - old: `super(tydux, "slice", commands, state);`
    - new: `super(tydux.createMountPoint("slice"), state, commands);`
    
    
# Version 12.0.1

fixing peer dependency warnings


# Version 12.0.0

- **breaking change** Changed API 

`createTyduxStore(initialState, enhancer, reducer)`

to

`createTyduxStore(initialState, reducer, enhancer)`

# Version 11.4.1

**FIX** Release 11.4.0 was broken

# Version 11.4.0

- added test util method `createTestFacade(commandsInstance, initialState)`

# Version 11.3.0

Fix error of missing functions in proxy object when compiling to ES5.

# Version 11.2.0

Facades can now provide their initial state with either the concrete state as value, a function returning the state or a promise that resolves the state:

```
class TestFacade extends Facade<number, Commands<number>> {
    constructor(tydux: TyduxStore<any>) {
    
        // one of:
        super(tydux, "test", new TestCommands(), 7);        // value
        super(tydux, "test", new TestCommands(), () => 7);  // functon
        super(tydux, "test", new TestCommands(), promise);  // promise

    }
}


``` 

# Version 11.1.0

Add support for Angular 8

# Version 11.0.0

Use build of Angular-CLI for tydux. Add demo application for Tydux and Tydux-Angular

## Breaking changes in Tydux-Angular

Replaced `TyduxModule.forRoot()` with `TyduxModule.forRootWithConfig(configFactory: () => TyduxConfiguration)` and `TyduxModule.forRootWithoutConfig()`

# Version 10.4.0

In this version we simplified the API

- TyduxStore's type parameter for the state is optional now
  
  If you don't use a global AppState previously you have to write ```TyduxStore<any>```. Now you can obmit the type parameter and just write ```TyduxStore```
- Extended Facade constructor signature
  
  Instead of creating a mount point manually and pass it to facade's constructor, you can now just pass the TyduxStore.
  Before:
  ```
  constructor(tydux: TyduxStore) {
    super(tydux.createRootMountPoint('name'), 'name', new Commands(), new State()); 
  }
  ```
  After:
    ```
    constructor(tydux: TyduxStore) {
      super(tydux, 'name', new Commands(), new State());
    }
    ```
  Facade will create a mount point for you with the given name (second parameter).

# Version 10.3.0

- added `destroyed` observable to facade


# Version 10.2.0

- Facades can now mount to possibly undefined mount points as long as they provide the initial state


# Version 10.1.0

- added TyduxStore#select()


# Version 10.0.2

- removed AngularJS 1.x integration


# Version 10.0.1

- added declaration source maps closes #16


# Version 10.0.0

- removed `ObservableSelection` due to this [TSLint rule](https://github.com/w11k/rx-utils#w11k-rxjs-subscribe-takeuntil)


# Version 9.3.1

- introduced CommandsInvoker (used internally and useful for testing)


# Version 9.3.0

**breaking change**

- renamed fassade to facade :-/



# Version 9.2.1

- selector for selectNonNil is now optional


# Version 9.2.0

- facades can now provide their initial state during the super call


# Version 9.1.2

- fixed IE bug regarding `toString`


# Version 9.0.1

- new version
- now based on Redux


# Version 8.3.2

- added es2015 modules to enable tree-shaking


# Version 8.3.1

- improved middleware logging


# Version 8.3.0

- added Store#destroy() and Store#ngOnDestroy()


# Version 8.2.0

- added supported for middleware
- BUGFIX: only use ES Proxys in development mode


# Version 8.1.3

- Requires TypeScript 2.9 or greater


# Version 8.1.2

- fixed bug: Angular integration: existing ngOnDestroy method was replaced and not preserved


# Version 8.1.0

- added `ObservableSelection.pipe()`
- improved DevTools support (jump to action)


# Version 8.0.2

- generate source maps for distribution build
- various internal implementation changes


# Version 8.0.0

- Requires RxJS >= 6
- Can be used with TypeScript <= 2.7 and >= 2.8 projects:
	- add a file e.g. `tydux.d.ts` to your project src folder and make sure that it gets included in the compilation process
	- add the line (change the path to `node_modules` according to your project):
		- TypeScript <= 2.7 projects: `/// <reference path="../node_modules/@w11k/tydux/dist/types27.d.ts" />`
		- TypeScript >= 2.8 projects: `/// <reference path="../node_modules/@w11k/tydux/dist/types28.d.ts" />`


# Version 7.0.0

- Removed StateObserver in favour of ObservableSelection. This API change makes it much easier for stores to return a selection.


# Version 6.0.3

- fixed devtools support


# Version 6.0.2

- fixed memory leak in View


# Version 6.0.0

- added View feature


# Forked Development: Version 5.x

- Version 5 will stay on TypeScript 2.7.x
- Removed View feature


# Version 5.1.0

- renamed `Mutators` to `Mutator`


# Version 5.0.1

- removed `createView` function in favour of `new View(...)`


# Version 5.0.0

- new feature: View
- removed: selectMany()

# Version 4.0.0-alpha

- alpha release: development version, changes discarded

# Version 3.0.0

- removed `UnboundedObservable`
- added `Store#unbound()`
- added `Store#bounded(operator)`
- added `selectMany()`

# Version 2.1.0

- fixed bug: JavaScript Proxy was used in prod mode
- store IDs must now be unique
 

# Version 2.0.7

- when `Store#select()` returns a plain object, values will only be emitted when the content of the returned object changed (shallow comparision)


# Version 2.0.6

- removed `UnboundedObservable.share()`
- added `UnboundedObservable.pipe()`


# Version 2.0.5

- added `selectMany` and `share()` for `UnboundedObservable`


# Version 2.0.4

- fixed RxJS import


# Version 2.0.3

- added `boundToComponent()` method to `UnboundedObservable`


# Version 2.0.1

- simplified store implementation
- print mutator run duration in dev tools


# Version 2.0.0

- **Breaking Change:** store.dispatch renamed to store.mutate
- Fixed several bugs involving instance variables
- DevTools: Better action name support for async methods
- Mutators must not return a Promise

# Version 1.3.2

- Fixed Bug in Store: Methods return value was ignored due to wrapMethods()


# Version 1.2.0

- select(...) now returns an UnboundedObservable 


# Version 1.1.0

- Forbid asynchronous code in mutators
- store.dispatch is now protected (was public)
