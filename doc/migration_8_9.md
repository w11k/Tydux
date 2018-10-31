
# Migration guide version 8 -> 9

## Store -> Fassade

- global "search/replace"
	- from: `extends Store<`
	- to: `extends Fassade<`
	
- add import statement `import {Fassade} from '@w11k/tydux';`

- swap the type parameter `Fassade<A, B>` -> `Fassade<B, A>`

- global "search/replace"
	- from: `this.mutate.`
	- to: `this.commands.`
	
- change constructor super call
```
constructor(tydux: TyduxStore<AppState>) {
	super(tydux.createRootMountPoint('myFassade'), 'MyFassade', new MyCommands());
}
```
	

## Mutators -> Commands

- global "search/replace"
	- from: `extends Fassade<`
	- to: `extends Commands<`

- add import statement `import {Commands} from '@w11k/tydux';`
