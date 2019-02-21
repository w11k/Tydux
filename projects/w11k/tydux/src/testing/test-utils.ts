import {createTyduxStore, MountPoint} from "../lib/store";

export function createTestMount<S>(initialState: S): MountPoint<S, S> {
  const tyduxStore = createTyduxStore(initialState);
  return tyduxStore.createMountPoint(s => s, (s, l) => Object.assign({}, l));
}

export function createAsyncPromise<T>(returns: T): Promise<T> {
  return new Promise<T>(resolve => {
    setTimeout(() => {
      resolve(returns);
    }, 0);

  });
}

