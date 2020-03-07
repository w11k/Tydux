import {InjectionToken, Injector, ModuleWithProviders, NgModule} from "@angular/core";
import {setGlobalStore, createTyduxStore, enableTyduxDevelopmentMode, TyduxDevModeConfig, TyduxStore} from "@w11k/tydux";
import {Reducer, StoreEnhancer} from "redux";

export const tyduxModuleConfiguration = new InjectionToken<() => TyduxConfiguration>("TyduxModuleConfiguration");

export interface TyduxConfiguration {
    name?: string;
    reducer?: Reducer;
    preloadedState?: any;
    enhancer?: StoreEnhancer;
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

    static forRootWithConfig(configFactory: () => TyduxConfiguration): ModuleWithProviders {
        return {
            ngModule: TyduxModule,
            providers: [
                ...staticProviders,
                {
                    provide: tyduxModuleConfiguration,
                    useValue: configFactory
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
    const config = configFactory();
    const initialState = Object.assign({}, config.preloadedState);

    if (config.developmentMode === true) {
        enableTyduxDevelopmentMode(config);
    }

    const tyduxStore = createTyduxStore(initialState, {
        name: config.name,
        reducer: config.reducer,
        enhancer: config.enhancer,
    });

    if (!config.skipGlobalStoreRegistration) {
        setGlobalStore(tyduxStore);
    }

    return tyduxStore;
}

