export class Mutator<S> {

    protected state!: S;

    // noinspection JSUnusedLocalSymbols: accessed during Store initialization
    constructor(private initialState: S) {
    }
}
export type MutatorState<G> = G extends Mutator<infer S> ? Readonly<S> : never;
