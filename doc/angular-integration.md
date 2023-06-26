[![Build Status](https://travis-ci.org/w11k/Tydux.svg?branch=master)](https://travis-ci.org/w11k/Tydux)
[![npm version](https://badge.fury.io/js/%40w11k%2Ftydux-angular.svg)](https://badge.fury.io/js/%40w11k%2Ftydux-angular)

![Tydux Logo](https://raw.githubusercontent.com/w11k/Tydux/master/doc/tydux_logo.png)

# Tydux Angular Integration

## Installation

**Install NPM package**

```shell
npm install @w11k/tydux @w11k/tydux-angular rxjs redux @redux-devtools/extension
```

**Add the Tydux Angular module**

```typescript
import {environment} from "../environments/environment";

@NgModule({
    imports: [
        TyduxModule.forRootWithConfig({environment})
    ],
    ...
})
export class AppModule {
}
```

**For standalone applications use provideTydux() in main.ts**
```typescript
import {importProvidersFrom, isDevMode} from "@angular/core";
import {provideTydux} from '@w11k/tydux-angular';
bootstrapApplication(AppComponent, {
    providers: [
        importProvidersFrom(BrowserModule),
        provideTydux({developmentMode: isDevMode()}),
    ]
    ,
})
```

**Create facades just like any Angular service**

```typescript
@Injectable({providedIn: 'root'})
export class MyFacade extends Facade<MyCommands> {

  constructor() {
    super('myFacade',                                // mountpoint name
          new MyCommands(),                          // commands instance
          new State1()                               // initial state
    );
  }

}
```

**use the facade in your components**

```typescript
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {

  constructor(private readonly myFacade: MyFacade) {
  }

}
```













