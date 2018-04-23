
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
