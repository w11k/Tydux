
[![Build Status](https://travis-ci.org/w11k/Tydux-angular.svg?branch=master)](https://travis-ci.org/w11k/Tydux-angular)
[![npm version](https://badge.fury.io/js/%40w11k%2Ftydux-angular.svg)](https://badge.fury.io/js/%40w11k%2Ftydux-angular)

![Tydux Logo](https://raw.githubusercontent.com/w11k/Tydux/master/doc/tydux_logo.png)

# Tydux Angular Integration

## Installation

**Install NPM package**

```
npm install @w11k/tydux-angular
```

**Define your initial state**

```
// your application state
export function createInitialState() {
  return {
    state1: new State1()
  };
}

// useful type alias 
export type AppState = ReturnType<typeof createInitialState>;
```

**Create a Tydux configuration factory function**

```
export function createTyduxConfig(): TyduxConfiguration {
  return {
    preloadedState: createInitialState(),
    storeEnhancer: environment.production ? undefined : composeWithDevTools(),
    developmentMode: !environment.production
  };
}
```


**Add Tydux Angular module**

```
@NgModule({
  imports: [
    TyduxModule.forRoot(createTyduxConfig) // !!! do not call factory function !!!
  ],
  ...
})
export class AppModule {
}
```


**Mark your facade as Injectable() and inject the TyduxStore**

```
@Injectable({providedIn: 'root'})
export class MyFacade extends Facade<State1, MyCommands> {

  constructor(tydux: TyduxStore<AppState>) {         // inject TyduxStore
    super(tydux.createRootMountPoint('state1'),      // the facade's mount point
          'State1',                                  // action's type prefix
          new MyCommands());
  }

}
```
