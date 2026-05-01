# Language Module (language.ts)

This module provides a lightweight, structured translation system for CFX (FiveM/RedM) + Browser builds using TypeScript.

It supports:

- Default language auto-loading
- Runtime language switching
- Nested JSON flattening (dot-notation keys)
- Placeholder interpolation (`{name}`)
- Reference tokens (`$(other.key)`)
- Cycle protection with max depth
- Config-driven behavior
- Fallback language support

---

## Location

- Implementation: `project/common/utils/language.ts`
- Types: `project/common/types/language.d.ts`

---

## Configuration

Language behavior is controlled via:

```ts
Config.Language
```

Example:

```json
{
  "Language": {
    "Directory": "static/language",
    "File": "en",
    "Extension": ".json",
    "Depth": 8,
    "WarnMissing": true,
    "Fallback": "en"
  }
}
```

---

## Config Options

| Option        | Purpose                                        |
| ------------- | ---------------------------------------------- |
| `Directory`   | Folder containing language files               |
| `File`        | Default language file name (without extension) |
| `Extension`   | File extension (default `.json`)               |
| `Depth`       | Maximum recursive reference resolution depth   |
| `WarnMissing` | Log warning when translation key is missing    |
| `Fallback`    | Language used if requested language fails      |

### Defaults

If a value is missing or invalid:

* `Depth` → `8`
* `File` → `"en"`
* `Extension` → `".json"`
* `Directory` → `"static/language"`
* `WarnMissing` → `true`
* `Fallback` → `"en"`

---

## File Structure

Language files must be JSON objects.

Example:

```json
{
  "ui": {
    "hello": "Hello {name}",
    "welcome": "Welcome to $(app.name)"
  },
  "app": {
    "name": "CFX Boilerplate"
  }
}
```

---

## Flattening Behavior

Nested objects are flattened using dot notation:

```json
{
  "ui": {
    "hello": "Hello"
  }
}
```

Becomes:

```
ui.hello
```

Only **string leaf values** are included in the dictionary.

Non-string values are ignored.

---

## Default Loading Behavior

On module import:

1. Config is read.
2. Default language file path is constructed.
3. `LoadJsonFile()` loads the default file.
4. In browser builds, `$BROWSER:` ensures resolution before use.
5. `loadDefault()` initializes the dictionary automatically.

No explicit `init()` is required.

---

## Browser Behavior

In browser builds:

```ts
$BROWSER: {
  defaultLanguage = await defaultLanguage;
}
```

This uses top-level await to ensure the default language is resolved before dictionary initialization.

⚠ Requires ESM + top-level await support in your build pipeline.

---

## Basic Usage

```ts
import { t, tk, lang } from '@common/utils/language';

t('ui.hello', { name: 'Mao' });
```

---

## API

### `t(key, args?)`

Returns translated string.

If key does not exist:

* Returns empty string
* Logs warning (if enabled)

Example:

```ts
t('ui.hello', { name: 'Mao' });
```

---

### `tk(key, args?)`

Translate-or-key.

If translation fails, returns the key instead.

```ts
tk('missing.key'); // "missing.key"
```

---

### `lang.loadLang(file)`

Loads a new language at runtime.

```ts
await lang.loadLang('da');
```

If the file does not exist:

* Logs warning
* Attempts to load fallback language

If fallback fails:

* Logs error
* Dictionary becomes empty

---

### `lang.getFile()`

Returns currently active language file name.

---

### `lang.getDictionary()`

Returns readonly flattened dictionary.

---

## Placeholders (`{}`)

Placeholders are replaced using values from `args`.

Example:

```json
{
  "greet": "Hello {name}"
}
```

```ts
t('greet', { name: 'Mao' });
```

Output:

```
Hello Mao
```

If placeholder value is `null` or `undefined`, it becomes empty string.

---

## References (`$()`)

Reference tokens allow one key to embed another.

Example:

```json
{
  "app.name": "CFX Boilerplate",
  "welcome": "Welcome to $(app.name)"
}
```

```ts
t('welcome');
```

Output:

```
Welcome to CFX Boilerplate
```

---

## Reference Resolution Rules

* Recursive resolution supported
* Stops after `Depth` levels
* Cycles are prevented

Example cycle:

```
a -> b -> a
```

Will not recurse infinitely.

Cyclic references resolve to empty string.

---

## Missing Keys

If a key does not exist:

```ts
t('unknown.key');
```

Behavior:

* Returns `""`
* Logs warning (if `WarnMissing = true`)
* Suppressed during early boot before first successful load

---

## Runtime Language Switching Example

```ts
logger.info('Current language:', lang.getFile());

await lang.loadLang('da');

logger.info('Switched to:', lang.getFile());
```

---

## Path Resolution

Files are resolved as:

```
{Directory}/{File}{Extension}
```

Example:

```
static/language/en.json
static/language/da.json
```

---

## Internal Dictionary Format

Flattened dictionary:

```ts
type Dict = Record<string, string>;
```

Example:

```json
{
  "ui": {
    "hello": "Hello"
  }
}
```

Becomes:

```ts
{
  "ui.hello": "Hello"
}
```

---

## Best Practices

### ✔ Keep language files string-only

Avoid storing non-string values.

### ✔ Avoid circular references

Although protected, cycles reduce clarity.

### ✔ Use fallback language wisely

Ensure fallback file always exists.

### ✔ Use `tk()` in UI labels

Prevents blank UI text if key is missing.

---

## Example (Recommended Usage)

```ts
import { t, tk, lang } from '@common/utils/language';
import { logger } from '@common/utils/logging';

logger.info('Language loaded:', lang.getFile());

$DEV: logger.debug('Dictionary', lang.getDictionary());

console.log(t('ui.hello', { name: 'Mao' }));
console.log(tk('ui.unknown'));

await lang.loadLang('da');
```

---