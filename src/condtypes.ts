class StateGroup<S> {
    constructor(readonly state: S) {
    }
}

type StateGroupState<G> = G extends StateGroup<infer S> ? S : never;

type StoreStateGroupStates<S> = {
    [K in keyof S]: S[K] extends StateGroup<any> ? StateGroupState<S[K]> : StoreStateGroupStates<S[K]>;
};

class Store {
    select(fn: (state: StoreStateGroupStates<this>) => any) {

    }
}

/////////////////////////////////////

const listGroupState = {
    list: [] as number[]
};

class ListGroup extends StateGroup<typeof listGroupState> {
    constructor() {
        super(listGroupState);
    }

    append(element: number) {
    }
}

class MyStore extends Store {
    s1 = new ListGroup();
    child = {
        childA: 1,
        childB: {
            childC: new ListGroup()
        }
    };
}

const myStore = new MyStore();
myStore.child.childB.childC.append(1);
myStore.select(state => {
    state.child.childB.childC.list.push(2);
});

