
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
