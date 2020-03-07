import {createTyduxStore} from "./store";
import {setGlobalStore} from "./store-global";

describe("global store", () => {
    it("only one global store is allowed", () => {
        const s1 = createTyduxStore();
        setGlobalStore(s1);
        const s2 = createTyduxStore();
        expect(() => setGlobalStore(s2)).toThrow("already defined");
    });
});
