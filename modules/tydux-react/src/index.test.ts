import {act, renderHook} from "@testing-library/react-hooks";
import {Commands, createTyduxStore, Facade} from "@w11k/tydux";
import {useFacadeState} from "./index";

describe("useFacadeState", () => {
    class TestCommands extends Commands<{ counter: number }> {
        increment(stepSize: number) {
            this.state.counter = this.state.counter + stepSize;
        }

        decrement(stepSize: number) {
            this.state.counter = this.state.counter - stepSize;
        }
    }

    class TestFacade extends Facade<TestCommands> {

        increment() {
            this.commands.increment(1);
        }

        decrement() {
            this.commands.decrement(1);
        }
    }

    it("should do something", async () => {
        const store = createTyduxStore();
        const facade = new TestFacade(
            store.createMountPoint("test"), new TestCommands(),
            {counter: 0}
        );
        // use same reference for selector function or result.all becomes strange
        const selectorFn = (state: {counter: number}) => state.counter
        const {result, waitForNextUpdate} = renderHook(() => useFacadeState(facade, selectorFn ));
        expect(result.current).toBe(0);
        act(() => {
            facade.increment();
        });
        await waitForNextUpdate();
        expect(result.current).toBe(1);
        act(() => {
            facade.decrement();
        });
        await waitForNextUpdate();
        expect(result.current).toBe(0);

        expect(result.all).toEqual([0, 1, 0]);
    });

    it("should replace nil values", async () => {
        class TestCommands extends Commands<{ message: string | null | undefined }> {
            setMessage(message: string | null | undefined) {
                this.state.message = message;
            }
        }

        class TestFacade extends Facade<TestCommands> {
            setMessage(message: string | null | undefined) {
                this.commands.setMessage(message);
            }
        }

        const store = createTyduxStore();
        const facade = new TestFacade(store.createMountPoint("test"), new TestCommands(), {message: undefined});
        const replacementValue = "42";
        const {result, waitForNextUpdate} = renderHook(
            () => useFacadeState(facade, state => state.message, replacementValue)
        );
        expect(result.current).toEqual(replacementValue);

        act(() => {
            facade.setMessage("Eve");
        });
        await waitForNextUpdate();
        expect(result.current).toEqual("Eve");

        act(() => {
            facade.setMessage(null);
        });
        await waitForNextUpdate();
        expect(result.current).toEqual(replacementValue);

        act(() => {
            facade.setMessage("Bob");
        });
        await waitForNextUpdate();
        expect(result.current).toEqual("Bob");

        act(() => {
            facade.setMessage(undefined);
        });
        await waitForNextUpdate();
        expect(result.current).toEqual(replacementValue);

    });
});
