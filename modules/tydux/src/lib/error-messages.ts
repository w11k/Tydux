
export const commandWrongReturnType = "command methods must not return a value";

export const commandHasInstanceMembers = "mutators must only have the instance member 'state' or members of type 'function'";

export const illegalAccessToThis = `
Illegal access to 'this'. Make sure that 'this' is not accessed in positions like the following:

- inside asynchronously called callbacks, e.g.
        > setTimeout(function() {
        >     // ILLEGAL POSITION
        > }, 1000);

- inside promise handlers, e.g.
        > promise.then(val => {
        >     // ILLEGAL POSITION
        > });

Solution: Move the asynchronous code to the store class.
`;

export const getIndexNotInArrayMessage = (arrLength: number) => `Index must at least be in the scope from 0 to ${arrLength - 1}`;
