# Modules

The `modules` layer provides reusable utilities, wrappers, abstractions, and type enhancements used throughout the boilerplate.

Its purpose is to improve the TypeScript development experience within the CFX ecosystem while remaining framework-agnostic and fully extensible.

Modules are separated by runtime context (client, server, common, and interface) and are designed to be independently adoptable rather than tightly coupled to the boilerplate itself.

---

# Purpose

The modules layer exists to provide:

* Strongly typed utilities for the CFX environment
* Reusable wrappers around native or boilerplate functionality
* Shared helper functions and guards
* Environment-aware development tooling
* Consistent abstractions for client, server, and interface runtimes
* Improved developer ergonomics and code maintainability

---

# Included Features

The modules directory may contain functionality such as:

<details>
<summary><strong>Classes & Wrappers</strong></summary>

---

Reusable abstractions built to simplify or enhance native CFX behavior.

Examples:

* `@client/hotkey`
  Advanced hotkey wrapper with support for:

  * press events
  * hold events
  * tap counting
  * grouped input handling
  * cleaner lifecycle management

* Logging wrappers

* Event abstractions

* State managers

* Runtime helpers
</details>

<details>
<summary><strong>Utilities</strong></summary>

---

Shared utility functions intended to reduce repetitive boilerplate logic.

Examples include:

* String validation
* Type coercion
* Runtime guards
* Safer object handling
* Typed helper functions
* Event source helpers
* Environment detection utilities
</details>

<details>
<summary><strong>Type Enhancements</strong></summary>

---

Additional typings created to improve the TypeScript experience inside the CFX environment.

This includes typings for:

* CFX-specific globals
* Shared runtime helpers
* Boilerplate-specific features
* Build-time environment labels

Examples:

* `$DEV`
* `$CLIENT`
* `$SERVER`
* `$BROWSER`

These labels are used during the build process to create environment-aware bundles and enable dead-code elimination where applicable.
</details>

---

# Module Documentation

Each module may contain its own dedicated `README.md` with detailed usage examples, configuration options, and implementation details.

<details>
<summary><strong>Available Modules</strong></summary>

* [Hotkey](./client/hotkey/README.md)
* [Logging](./common/logging/README.md)
* [Language](./common/language/README.md)

</details>

---

# Design Philosophy

The modules system is intentionally designed around:

* standalone adoption
* minimal coupling
* strong typing
* runtime separation
* composability
* extensibility

The goal is to provide high-quality building blocks without forcing a strict framework architecture onto the developer.
