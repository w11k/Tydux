
# State and store

**e.g. in `app-store.ts`** 

## Initial state factory 

```
// your application state
export function createInitialState() {
  return {
    state1: new State1(),
    state2: new State2(),
  };
}

// useful type alias 
export type AppState = ReturnType<typeof createInitialState>;
```

## Redux store factory and Tydux integration

```
export function createTyduxStore() {
  const bridge = new TyduxReducerBridge();           // Tydux integration bridge
  const reduxStore = createStore(                    // create Redux store
    bridge.createTyduxReducer(createInitialState()),
    devToolsEnhancer({})
  );
  return bridge.connectStore(reduxStore);            // create Tydux store
}

```

# Angular module

**e.g. in `app-store.module.ts`** 

```
@NgModule({
  providers: [
    {
      provide: TyduxStore,
      useFactory: createTyduxStore,                  // use above factory
    },
  ],
})
export class AppStoreModule {
}
```

**import the `AppStoreModule`:**

```
@NgModule({
  imports: [
    ...,
    AppStoreModule                                   // import the AppStoreModule in your AppModule
  ],
  ...
})
export class AppModule {
}
```

# Create facades

**e.g. in `myfacade.ts`** 

```
@Injectable()
export class MyFacade extends Facade<State1, MyCommands> {

  constructor(tydux: TyduxStore<AppState>) {         // inject TyduxStore
    super(tydux.createRootMountPoint('state1'),      // the facade's mount point
          'State1',  
          new MyCommands());
  }

}
```

**provide the facade:**

```
@NgModule({
  providers: [
    ...,
    MyFacade                                        // add a provider for your facade
  ],
  ...
})
export class AppModule {
}
```
