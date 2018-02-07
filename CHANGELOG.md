# Version 2.0.0

- **Breaking Change:** store.dispatch renamed to store.mutate
- Fixed several bugs involving instance variables
- DevTools: Better action name support for async methods

# Version 1.3.2

- Fixed Bug in Store: Methods return value was ignored due to wrapMethods()


# Version 1.2.0

- select(...) now returns an UnboundedObservable 


# Version 1.1.0

- Forbid asynchronous code in mutators
- store.dispatch is now protected (was public)
