
[![Build Status](https://travis-ci.org/w11k/Tydux-angular.svg?branch=master)](https://travis-ci.org/w11k/Tydux-angular)
[![npm version](https://badge.fury.io/js/%40w11k%2Ftydux-angular.svg)](https://badge.fury.io/js/%40w11k%2Ftydux-angular)

![Tydux Logo](https://raw.githubusercontent.com/w11k/Tydux/master/doc/tydux_logo.png)

# Tydux Angular Integration

## Installation

**Install NPM package**

```
npm install @w11k/tydux @w11k/tydux-angular @w11k/rx-ninja rxjs redux redux-devtools-extension
```

**Create a Tydux configuration factory function**

```
export function createTyduxConfig(): TyduxConfiguration {
  return {
    developmentMode: !environment.production,
    devToolsOptions: {
        trace: true,
        traceLimit: 10,
    }
  };
}
```


**Add the Tydux Angular module**

```
@NgModule({
  imports: [
    TyduxModule.forRootWithConfig(createTyduxConfig) // !!! do not call factory function !!!
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

  constructor(tydux: TyduxStore) {                   // inject TyduxStore
    super(tydux,                                     // pass store
          'state1',                                  // mountpoint name
          new MyCommands(),                          // commands instance
          new State1()                               // initial state
    );
  }

}
```
