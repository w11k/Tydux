# Version 17.0.0

- upgraded to Angular 21 (from Angular 16); the workspace tooling was migrated to Nx 22
  (note: Nx 22 supports Angular up to 21)
- updated the workspace to the latest Angular 21 patch releases and aligned Nx 22,
  Jest 30, Cypress 15, ESLint, Prettier and PostCSS tooling
- removed the unused direct `@w11k/rx-ninja` dependency and the legacy peer-dependency workaround
- kept TypeScript out of the published peer dependencies so TypeScript 6 and 7 consumers
  are not constrained by Tydux-Angular
- replaced the deprecated `APP_INITIALIZER` provider with `provideAppInitializer(...)`
  inside `provideTydux()` (the standalone-first API)
- updated peer dependencies to `@angular/common`/`@angular/core` `>=21` and `@w11k/tydux` `^18.0.0`

## Breaking Changes

- requires Angular `>=21`
- requires `@w11k/tydux` `^18` (Redux 5 / Immer 11)
