
# Migration guide version 8 -> 9

## Store -> Facade

- global "search/replace"
	- from: `extends Store<`
	- to: `extends Facade<`
	
- add import statement `import {Facade} from '@w11k/tydux';`

- swap the type parameter `Facade<A, B>` -> `Facade<B, A>`

- global "search/replace"
	- from: `this.mutate.`
	- to: `this.commands.`
	
- change constructor super call
```
constructor(tydux: TyduxStore<AppState>) {
	super(tydux.createRootMountPoint('myFacade'), 'MyFacade', new MyCommands());
}
```
	

## Mutators -> Commands

- global "search/replace"
	- from: `extends Mutator<`
	- to: `extends Commands<`

- add import statement `import {Commands} from '@w11k/tydux';`
