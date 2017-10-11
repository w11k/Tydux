
# Modifier Hooks

Tydux provides `Observable`s to observe the execution of modifiers. For each individual modifier you can observe before the modifier gets executed and after the modifier has been executed.

## Example
	
	class MyState {
	    count = 0;
	}
	
	class MyMutators extends Mutators<MyState> {
	    increment() {
	        this.state.count++;
	    }
	}
	
	class MyStore extends Store<MyMutators, MyState> {
	    constructor() {
	        super("myStore", new MyMutators(), new MyState());
	    }
	}
	
	const store = new MyStore();
	
	// before hook
	store.hooks.increment.before.subscribe(() => {
	    console.log("before", store.state.count);
	});
	
	// after hook
	store.hooks.increment.after.subscribe(() => {
	    console.log("after", store.state.count);
	});
	
	store.dispatch.increment();
	
	// prints
	// >> before 0
	// >> after 1
	
