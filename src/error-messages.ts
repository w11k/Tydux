
export const mutatorWrongReturnType = "mutator methods must not return a value";

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
