
# Modifier Hooks

Tydux provides `Observable`s to observe the execution of mutators. For each individual mutator you can observe before the mutator gets executed and after the mutator has been executed.

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
	
