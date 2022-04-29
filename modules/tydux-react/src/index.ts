import {isNil} from "@w11k/rx-ninja";
import {Commands, Facade} from "@w11k/tydux";
import {CommandsState} from "@w11k/tydux/lib/commands";
import {Dispatch, SetStateAction, useEffect, useState} from "react";

export function useFacadeState<R, C extends Commands<any>>(
    facade: Facade<C>,
    selector?: (state: Readonly<CommandsState<C>>) => R): R;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
/**
 * Extracts the latest value from the Tydux Facade.
 *
 * @param facade that holds state of interest
 * @param selector function to select sub-state see {@link Facade#select}
 * @param nilReplacement value to replace if selected (sub-)state is null or undefined
 * */
export function useFacadeState<R, C extends Commands<any>>(
    facade: Facade<C>,
    selector: (state: Readonly<CommandsState<C>>) => R,
    nilReplacement: NonNullable<R>): NonNullable<R>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useFacadeState<R, C extends Commands<any>>(
    facade: Facade<C>,
    selector?: (state: Readonly<CommandsState<C>>) => R,
    nilReplacement?: NonNullable<R>): R {

    const [state, setState]: [R, Dispatch<SetStateAction<R>>] =
        useState(selector !== undefined
            ? selector(facade.state)
            : facade.state);

    if (isNil(state) && !isNil(nilReplacement)) {
        setState(nilReplacement);
    }

    useEffect(() => {
        const sub = facade.select(selector).subscribe(val => {
            if (isNil(nilReplacement) || !isNil(val)) {
                setState(val);
            } else {
                setState(nilReplacement);
            }
        });
        return () => sub.unsubscribe();
    }, [facade, selector, nilReplacement]);

    return state;
}
