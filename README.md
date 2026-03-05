# cfx-ts-boilerplate

A modern TypeScript boilerplate for FiveM resources using esbuild + Vite.

## Features
- Server / Client / Interface separation
- Typed command system
- Build pipeline with watch + production mode
- NUI (React + Vite)

### Setup

Navigate to your new directory and execute the following command to install dependencies.

```
pnpm install
```

## Development

Use `pnpm build:dev` to build all project files in a readable production mode.

Use `pnpm watch` to actively rebuild modified files while developing the resource.

During web development, use `pnpm web:dev` to start vite's webserver and watch for changes.

## Build

Use `pnpm build` to build all project files in production mode.

To build and create GitHub releases, tag your commit (e.g. `v1.0.0`) and push it.

## Structural Layout

**Root Level**: Contains configuration files (e.g., package.json, tsconfig.json), build artifacts (e.g., fxmanifest.lua), and documentation (e.g., README.md).
- **project/**: Houses source code, divided into contexts:
  - **client/**: Client-side scripts (e.g., index.ts).
  - **server/**: Server-side scripts (e.g., index.ts), including utilities (e.g., commands.ts).
  - **common/**: Shared code across contexts (e.g., index.ts), with types (e.g., commands.d.ts) and utilities (e.g., logging.ts).
  - **interface/**: NUI (browser) interface (e.g., index.html), built with Vite (e.g., vite.config.ts).
- **static/**: Static assets and configuration (e.g., static/config.json, language files in static/language/).
- **scripts/**: Build and utility scripts (e.g., build.ts, with helpers in utils).
- **Build Output**: Compiled files go to **dist/** (e.g., dist/client/index.js, dist/interface/).
- **Separation Rule**: Code is strictly separated by runtime context (server, client, web), with common shared utilities.
- **Configuration Rule**: Behavior is driven by static/config.json and build-time labels (e.g., $DEV, $SERVER).
- **File Loading Rule**: Use files.ts for resource-relative paths, adjusted by resource.ts.