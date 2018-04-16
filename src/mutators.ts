export class StateMutators<S> {

    protected state!: S;

    // noinspection JSUnusedLocalSymbols: accessed during Store initialization
    constructor(private initialState: S) {
    }
}
export type MutatorState<G> = G extends StateMutators<infer S> ? Readonly<S> : never;
