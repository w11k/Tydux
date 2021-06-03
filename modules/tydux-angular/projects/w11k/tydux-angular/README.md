[![Build Status](https://travis-ci.org/w11k/Tydux.svg?branch=master)](https://travis-ci.org/w11k/Tydux)
[![npm version](https://badge.fury.io/js/%40w11k%2Ftydux-angular.svg)](https://badge.fury.io/js/%40w11k%2Ftydux-angular)

![Tydux Logo](https://raw.githubusercontent.com/w11k/Tydux/master/doc/tydux_logo.png)

# Tydux Angular Integration

## Installation

**Install NPM package**

```
npm install @w11k/tydux @w11k/tydux-angular @w11k/rx-ninja rxjs redux redux-devtools-extension
```

**Add the Tydux Angular module**

```
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

**Create facades just like any Angular service**

```
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

```
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














