import {APP_INITIALIZER, inject, InjectionToken, ModuleWithProviders, NgModule, Provider} from '@angular/core';
import {Reducer, StoreEnhancer} from "redux"
import {
  createTyduxStore,
  enableTyduxDevelopmentMode,
  setGlobalStore,
  TyduxDevModeConfig,
  TyduxStore
} from '@w11k/tydux';

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

@NgModule({})
export class TyduxModule {

  constructor() {
  }

  static forRootWithConfig(config: TyduxConfiguration | (() => TyduxConfiguration)): ModuleWithProviders<TyduxModule> {
    return {
      ngModule: TyduxModule,
      providers: provideTydux(config)
    };
  }

  static forRootWithoutConfig(): ModuleWithProviders<TyduxModule> {
    return {
      ngModule: TyduxModule,
      providers: provideTydux()
    };
  }
}

export function factoryTyduxStore(): TyduxStore {
  const configFactory = inject(tyduxModuleConfiguration) ?? {} as TyduxConfiguration;
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

export function provideTydux(config?: TyduxConfiguration | (() => TyduxConfiguration)): Provider[] {
  return [
    {provide: TyduxStore, useFactory: factoryTyduxStore},
    {provide: tyduxModuleConfiguration, useValue: config ?? {} as TyduxConfiguration},
    {provide: APP_INITIALIZER, useFactory: () => (store: TyduxStore) => store, multi: true, deps: [TyduxStore]}
  ]
}
