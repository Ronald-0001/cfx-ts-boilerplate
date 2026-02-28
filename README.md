### Setup

Navigate to your new directory and execute the following command to install dependencies.

```
pnpm install
```

## Development

Use `pnpm watch` to actively rebuild modified files while developing the resource.

During web development, use `pnpm web:dev` to start vite's webserver and watch for changes.

## Build

Use `pnpm build` to build all project files in production mode.

To build and create GitHub releases, tag your commit (e.g. `v1.0.0`) and push it.

## Structural Layout

- [/dist/](dist)
  - Compiled project files.
- [/scripts/](scripts)
  - Scripts used in the development process, but not part of the compiled resource.
- [/project/](project)
  - Project source code.
- [/static/](static)
  - Files to include with the resource that aren't compiled or loaded (e.g. config).