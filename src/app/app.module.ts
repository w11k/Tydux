import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { TodoListComponent } from './todo-list/todo-list.component';
import { CoreModule } from './core/core.module';
import { TodoListContextComponent } from './todo-list-context/todo-list-context.component';
import { TyduxConfiguration, TyduxModule } from '@w11k/tydux-angular';
import { environment } from '../environments/environment';
import { composeWithDevTools } from 'redux-devtools-extension';
import { FormsModule } from '@angular/forms';

@NgModule({
  declarations: [
    AppComponent,
    TodoListComponent,
    TodoListContextComponent
  ],
  imports: [
    BrowserModule,
    CoreModule,
    FormsModule,
    TyduxModule.forRootWithConfig(createTyduxConfig)
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }


export function createTyduxConfig(): TyduxConfiguration {
  return {
    storeEnhancer: environment.production ? undefined : composeWithDevTools(),
    developmentMode: !environment.production
  };
}
