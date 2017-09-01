# Installation

Tydux is available as NPM package:

```
npm install tydux
```

[![NPM](https://nodei.co/npm/tydux.png)](https://npmjs.org/package/tydux)

# Development vs. Production Mode

By default, Tydux runs in **production mode**. This means that various checks are disabled for better runtime performance.

It is highly recommended that you enable the **development mode** for development environments:

```
import {enableDevelopmentMode} from "tydux";

enableDevelopmentMode();
```
