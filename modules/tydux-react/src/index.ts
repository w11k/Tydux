import {isNil} from "@w11k/rx-ninja";
import {Dispatch, SetStateAction, useEffect, useState} from "react";
import {Commands, Facade} from "@w11k/tydux";
import {CommandsState} from "@w11k/tydux/lib/commands";

export function useFacadeState<R, C extends Commands<any>>(
    facade: Facade<C>,
    selector?: (state: Readonly<CommandsState<C>>) => R): R;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
