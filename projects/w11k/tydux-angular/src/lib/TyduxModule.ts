import {InjectionToken, Injector, ModuleWithProviders, NgModule} from "@angular/core";
import {enableTyduxDevelopmentMode, TyduxReducerBridge, TyduxStore} from "@w11k/tydux";
import {createStore, Reducer, Store, StoreEnhancer} from "redux";

export const REDUX_STORE = new InjectionToken("ReduxStoreByTyduxToken");
export const tyduxModuleConfiguration = new InjectionToken<() => TyduxConfiguration>("TyduxModuleConfiguration");

export interface TyduxConfiguration {
    reducer?: Reducer;
    preloadedState?: any;
    storeEnhancer?: StoreEnhancer;
    developmentMode?: boolean;
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

    if (config.developmentMode === true) {
        enableTyduxDevelopmentMode(config.developmentMode);
    }

    return createStore(
        bridge.wrapReducer(reducer),
        initialState,
        config.storeEnhancer);
}

export function factoryTyduxStore(redux: Store, bridge: TyduxReducerBridge) {
    return bridge.connectStore(redux);
}
