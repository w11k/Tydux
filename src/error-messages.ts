
export const mutatorWrongReturnType = "mutator methods must return void|Promise<void>";

export const illegalAccessToThisState = `

Illegal access to 'this.state'. Make sure that 'this.state' is not accessed in one of these positions:

- inside asynchronously called callbacks, e.g. 
        > setTimeout(function() { 
        >     // ILLEGAL POSITION
        > }, 1000);
        
- in async functions, after an await statement, e.g.
        > async mutator() {
        >     // OK POSITION
        >     const val = await returnsPromise();
        >     // ILLEGAL POSITION
        > }
`;
