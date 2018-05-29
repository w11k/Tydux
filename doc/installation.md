# Installation

## Step 1/2: install NPM package

Tydux is available as [NPM package](https://www.npmjs.com/package/@w11k/tydux):

```
npm install @w11k/tydux
```

## Step 2/2: choose typings depending on your TypeScript version

Tydux can be used with TypeScript <= 2.7 and >= 2.8 projects. However, since Tydux uses the TypeScript feature 'conditional types' added in TypeScript 2.8, you need to configure the compilation process:

Add a file e.g. `tydux.d.ts` to your project src folder and make sure that it gets included in the compilation process. Add the following line depending on your TypeScript version and change the path to your `node_modules` folder:

- TypeScript <= 2.7 projects: `/// <reference path="../node_modules/@w11k/tydux/dist/types27.d.ts" />`
- TypeScript >= 2.8 projects: `/// <reference path="../node_modules/@w11k/tydux/dist/types28.d.ts" />`

This only affects Tydux's "view" feature. Projects with TypeScript <= 2.7 are only able to access the view's state tree via the `any` type. 


# Development vs. Production Mode

By default, Tydux runs in **production mode**. This means that various checks are disabled for better runtime performance.

It is highly recommended that you enable the **development mode** for development environments:

```
import {enableTyduxDevelopmentMode} from "tydux";

enableTyduxDevelopmentMode();
```
