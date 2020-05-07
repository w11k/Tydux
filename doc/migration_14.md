
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




