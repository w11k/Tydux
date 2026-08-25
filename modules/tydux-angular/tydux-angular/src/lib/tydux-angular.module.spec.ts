import {ApplicationInitStatus} from '@angular/core';
import {TestBed} from '@angular/core/testing';
import {getGlobalStore, removeGlobalStore, TyduxStore} from '@w11k/tydux';
import {provideTydux, TyduxModule} from './tydux-angular.module';

describe('provideTydux', () => {

  afterEach(() => {
    removeGlobalStore();
  });

  it('provides a TyduxStore instance', () => {
    TestBed.configureTestingModule({
      providers: [provideTydux()],
    });

    const store = TestBed.inject(TyduxStore);
    expect(store).toBeInstanceOf(TyduxStore);
  });

  it('registers the store globally through the app initializer', async () => {
    TestBed.configureTestingModule({
      providers: [provideTydux()],
    });

    // Triggers the APP_INITIALIZER replacement (provideAppInitializer)
    await TestBed.inject(ApplicationInitStatus).donePromise;

    const store = TestBed.inject(TyduxStore);
    expect(getGlobalStore()).toBe(store);
  });

  it('does not register globally when skipGlobalStoreRegistration is set', async () => {
    TestBed.configureTestingModule({
      providers: [provideTydux({skipGlobalStoreRegistration: true})],
    });

    await TestBed.inject(ApplicationInitStatus).donePromise;
    TestBed.inject(TyduxStore);

    expect(() => getGlobalStore()).toThrow();
  });

  it('exposes a NgModule compatibility layer via forRootWithoutConfig', () => {
    const moduleWithProviders = TyduxModule.forRootWithoutConfig();
    expect(moduleWithProviders.ngModule).toBe(TyduxModule);
    expect(moduleWithProviders.providers?.length ?? 0).toBeGreaterThan(0);
  });

});
