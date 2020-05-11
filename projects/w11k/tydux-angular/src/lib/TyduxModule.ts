import {InjectionToken, Injector, ModuleWithProviders, NgModule} from "@angular/core";
import {createTyduxStore, enableTyduxDevelopmentMode, setGlobalStore, TyduxDevModeConfig, TyduxStore} from "@w11k/tydux";
import {Reducer, StoreEnhancer} from "redux";

export const tyduxModuleConfiguration = new InjectionToken<TyduxConfiguration | (() => TyduxConfiguration)>("TyduxModuleConfiguration");

export interface TyduxConfiguration {
    name?: string;
    reducer?: Reducer;
    preloadedState?: any;
    enhancer?: StoreEnhancer;
    environment?: {
        production: boolean,
    };
    developmentMode?: boolean;
    skipGlobalStoreRegistration?: boolean;

    devToolsOptions?: TyduxDevModeConfig["devToolsOptions"];
    autoUseDevToolsInDevelopmentMode?: TyduxDevModeConfig["autoUseDevToolsInDevelopmentMode"];
}

const staticProviders = [
    {
        provide: TyduxStore,
        deps: [
            Injector, // To provide optional tyduxModuleConfiguration get Injector
        ],
        useFactory: factoryTyduxStore,
    },
];

@NgModule({})
export class TyduxModule {

    constructor(injector: Injector) {
        // Trigger eager Tydux creation. Required for global store registration.
        injector.get(TyduxStore);
    }

    static forRootWithConfig(config: TyduxConfiguration | (() => TyduxConfiguration)): ModuleWithProviders {
        return {
            ngModule: TyduxModule,
            providers: [
                ...staticProviders,
                {
                    provide: tyduxModuleConfiguration,
                    useValue: config
                }
            ]
        };
    }

    static forRootWithoutConfig(): ModuleWithProviders {
        return {
            ngModule: TyduxModule,
            providers: [
                ...staticProviders,
            ]
        };
    }
}

export function factoryTyduxStore(injector: Injector) {
    const configFactory = injector.get(tyduxModuleConfiguration, () => ({} as TyduxConfiguration));
    const config = typeof configFactory === "function" ? configFactory() : configFactory;
    const initialState = Object.assign({}, config.preloadedState);

    if (config.developmentMode === undefined && config.environment !== undefined && !config.environment.production) {
        enableTyduxDevelopmentMode(config);
    } else if (config.developmentMode === true) {
        enableTyduxDevelopmentMode(config);
    }

    const tyduxStore = createTyduxStore(initialState, {
        name: config.name,
        reducer: config.reducer,
        enhancer: config.enhancer,
    });

    if (config.skipGlobalStoreRegistration !== true) {
        setGlobalStore(tyduxStore);
    }

    return tyduxStore;
}

