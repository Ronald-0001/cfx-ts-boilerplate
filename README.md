# cfx-ts-boilerplate

A modern TypeScript boilerplate for CFX resources focused on strong typing, runtime separation, and standalone modular architecture.

Built around:

* TypeScript
* esbuild
* Vite
* runtime-aware builds
* reusable modular utilities

---

# Status

> This project is currently under active development.
> Structural changes and module APIs may still evolve between releases.

---

# Features

* Client / Server / Interface runtime separation
* Modular architecture
* Typed utility layer
* Environment-aware builds
* esbuild pipeline
* Vite-powered interface development
* Build-time runtime labels
* Framework-agnostic design

---

# Installation

```bash
pnpm install
```

---

# Development

| Command          | Description                     |
| ---------------- | ------------------------------- |
| `pnpm watch`     | Watch and rebuild project files |
| `pnpm build:dev` | Development build               |
| `pnpm build`     | Production build                |
| `pnpm web:dev`   | Start Vite interface dev server |

---

# Project Documentation

<details>
<summary><strong>Project Structure</strong></summary>

* [Project](./project/README.md)
* [Modules](./modules/README.md)
* [Interface- wip](./project/interface/README.md)

</details>

<details>
<summary><strong>Build System</strong></summary>

* [Build Pipeline- wip](./scripts/README.md)
* [Environment Labels- wip](./environment.md)

</details>

---

# Design Goals

The boilerplate is designed around a few core principles:

* standalone-first architecture
* minimal framework coupling
* strong TypeScript support
* runtime separation
* extensibility
* modular adoption

The goal is to provide reusable building blocks without enforcing a rigid framework structure.