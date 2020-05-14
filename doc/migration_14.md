
# Migration guide for version 14

## Remove generic state type

You no longer need to specify the generic type for the state type when extending `Facade`. If however you want or need to, the parameter now comes last.


Previous versions:

```
class MyFacade extends Facade<MyState, MyCommands> {}
```

New in version 14:

```
class MyFacade extends Facade<MyCommands> {}
```

## Global Tydux store

A Tydux store can now be registered as the "global store":

```
const store = createTyduxStore();
setGlobalStore(store);
```

When a global store is registered, facades only need to pass their mount point name during the `super` call:

```
class MyFacade extends Facade<MyCommands> {
    constructor() {
        super("myFacade", new MyCommands(), new MyState());
    }
}
```

**Note for Angular uses:** The `TyduxModule` will automatically register a global store.




