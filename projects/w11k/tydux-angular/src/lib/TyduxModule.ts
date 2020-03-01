import {InjectionToken, Injector, ModuleWithProviders, NgModule} from "@angular/core";
import {
    checkDevModeAndCreateDevToolsEnabledComposeFn,
    createTyduxStore,
    enableTyduxDevelopmentMode,
    TyduxDevModeConfig,
    TyduxStore
} from "@w11k/tydux";
import {compose, Reducer, StoreEnhancer} from "redux";

export const tyduxModuleConfiguration = new InjectionToken<() => TyduxConfiguration>("TyduxModuleConfiguration");

export interface TyduxConfiguration {
    reducer?: Reducer;
    preloadedState?: any;
    enhancer?: StoreEnhancer;
    developmentMode?: boolean;

    devToolsOptions?: TyduxDevModeConfig["devTools"];
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
    // const reducer = config.reducer !== undefined ? config.reducer : (state: any) => state;

    if (config.developmentMode === true) {
        enableTyduxDevelopmentMode(config);
    }

    // const composeEnhancers = config.autoUseDevToolsInDevelopmentMode
    //     ? checkDevModeAndCreateDevToolsEnabledComposeFn()
    //     : compose;

    // const bridge = new TyduxReducerBridge();
    // const reduxStore = createStore(
    //     bridge.wrapReducer(reducer),
    //     initialState,
    //     config.enhancer ? composeEnhancers(config.enhancer) : composeEnhancers()
    // );

    return createTyduxStore(initialState, {
        reducer: config.reducer,
        enhancer: config.enhancer,
    });
}

