import {importProvidersFrom, isDevMode} from "@angular/core";
import {bootstrapApplication, BrowserModule} from "@angular/platform-browser";
import {provideTydux} from "@w11k/tydux-angular";
import {AppComponent} from "./app/app.component";


bootstrapApplication(AppComponent, {
    providers: [
        importProvidersFrom(BrowserModule),
        // importProvidersFrom(TyduxModule.forRootWithConfig({developmentMode: true})),
        // importProvidersFrom(TyduxModule.forRootWithoutConfig()),
        provideTydux({developmentMode: isDevMode()}),
    ]
    ,
})
    .catch(err => console.error(err));
