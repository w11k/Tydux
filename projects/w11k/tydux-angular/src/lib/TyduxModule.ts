import {InjectionToken, Injector, ModuleWithProviders, NgModule} from "@angular/core";
import {createDevToolsEnabledComposeFn, enableTyduxDevelopmentMode, TyduxReducerBridge, TyduxStore} from "@w11k/tydux";
import {compose, createStore, Reducer, Store, StoreEnhancer} from "redux";
import {EnhancerOptions} from "redux-devtools-extension";

export const REDUX_STORE = new InjectionToken("ReduxStoreByTyduxToken");
export const tyduxModuleConfiguration = new InjectionToken<() => TyduxConfiguration>("TyduxModuleConfiguration");

export interface TyduxConfiguration {
    reducer?: Reducer;
    preloadedState?: any;
    storeEnhancer?: StoreEnhancer;
    developmentMode?: boolean;
    devToolsOptions?: EnhancerOptions,
    autoUseDevToolsInDevelopmentMode?: boolean;
}

const staticProviders = [
    TyduxReducerBridge,
    {
        provide: REDUX_STORE,
        deps: [
            Injector, // To provide optional tyduxModuleConfiguration get Injector
            TyduxReducerBridge
        ],
        useFactory: factoryReduxStore,
    },
    {
        provide: TyduxStore,
        deps: [REDUX_STORE, TyduxReducerBridge],
        useFactory: factoryTyduxStore
    }];

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

export function factoryReduxStore(injector: Injector, bridge: TyduxReducerBridge) {
    const configFactory = injector.get(tyduxModuleConfiguration, () => ({} as TyduxConfiguration));
    const config = configFactory();
    const initialState = Object.assign({}, config.preloadedState);
    const reducer = config.reducer !== undefined ? config.reducer : (state: any) => state;
    const autoUseDevToolsInDevelopmentMode = config.autoUseDevToolsInDevelopmentMode !== false;

    if (config.developmentMode === true) {
        enableTyduxDevelopmentMode(config.developmentMode);
    }

    const composeEnhancers = autoUseDevToolsInDevelopmentMode
        ? createDevToolsEnabledComposeFn(config.devToolsOptions)
        : compose;

    return createStore(
        bridge.wrapReducer(reducer),
        initialState,
        config.storeEnhancer ? composeEnhancers(config.storeEnhancer) : composeEnhancers()
    );
}

export function factoryTyduxStore(redux: Store, bridge: TyduxReducerBridge) {
    return bridge.connectStore(redux);
}
