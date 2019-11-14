# Installation

## Install NPM package

Tydux is available as [NPM package](https://www.npmjs.com/package/@w11k/tydux):

```
npm install @w11k/tydux @w11k/rx-ninja rxjs redux redux-devtools-extension
```

# Development vs. Production Mode

By default, Tydux runs in **production mode**. This means that various checks are disabled for better runtime performance.

It is highly recommended that you enable the **development mode** for development environments:

```
import {enableTyduxDevelopmentMode} from "@w11k/tydux";

enableTyduxDevelopmentMode();
```
