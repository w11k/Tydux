import { InjectionToken, ModuleWithProviders, NgModule } from "@angular/core";
import { enableTyduxDevelopmentMode, TyduxReducerBridge, TyduxStore } from "@w11k/tydux";
import { createStore, Reducer, Store, StoreEnhancer } from "redux";

export const REDUX_STORE = new InjectionToken("ReduxStoreByTyduxToken");
export const tyduxModuleConfiguration = new InjectionToken("TyduxModuleConfiguration");

export interface TyduxConfiguration {
  reducer?: Reducer;
  preloadedState?: any;
  storeEnhancer?: StoreEnhancer;
  developmentMode?: boolean;
}

@NgModule({
  imports: [],
  providers: [
    TyduxReducerBridge,
    {
      provide: REDUX_STORE,
      deps: [tyduxModuleConfiguration, TyduxReducerBridge],
      useFactory: factoryReduxStore,
    },
    {
      provide: TyduxStore,
      deps: [REDUX_STORE, TyduxReducerBridge],
      useFactory: factoryTyduxStore
    }
  ]
})
export class TyduxModule {

  static forRoot(configFactory?: () => TyduxConfiguration): ModuleWithProviders {
    return {
      ngModule: TyduxModule,
      providers: [
        {
          provide: tyduxModuleConfiguration,
          useValue: configFactory !== undefined ? configFactory : nothing
        }
      ]
    };
  }

}

export function factoryReduxStore(configFactory: () => TyduxConfiguration, bridge: TyduxReducerBridge) {
  const config = configFactory();
  const initialState = Object.assign({}, config.preloadedState);
  const reducer = config.reducer !== undefined ? config.reducer : (state: any) => state;

  if (config.developmentMode !== undefined) {
    enableTyduxDevelopmentMode(config.developmentMode);
  }

  return createStore(
    bridge.wrapReducer(reducer),
    initialState,
    config.storeEnhancer);
}

export function factoryTyduxStore(redux: Store, bridge: TyduxReducerBridge) {
  return bridge.connectStore(redux)
}

export function nothing() {
  return {};
}
