declare const window: {
  GetParentResourceName: () => string;
};

/**
 * Indicates the runtime environment type.
 *
 * Possible values:
 *
 * - `0` — Game runtime (client/server resource environment)
 * - `1` — CEF (FiveM NUI / embedded browser)
 * - `2` — Standard web browser
 *
 * This value is determined by inspecting the global `window` object
 * and the presence of `GetParentResourceName`, which is exposed by
 * the CFX NUI environment.
 */
export const IsBrowser =
  typeof window === 'undefined'
    ? 0 // Game
    : typeof window.GetParentResourceName !== 'undefined'
      ? 1 // CEF
      : 2; // Browser

/**
 * Identifies the execution context of the current resource.
 *
 * Possible values:
 *
 * - `"server"` — Running on the server runtime
 * - `"client"` — Running on the game client runtime
 * - `"web"` — Running inside a browser or NUI environment
 *
 * This is derived from `IsBrowser` and `IsDuplicityVersion()`.
 */
export const ResourceContext = IsBrowser ? 'web' : IsDuplicityVersion() ? 'server' : 'client';

/**
 * Resolves the resource name associated with the current runtime.
 *
 * Resolution rules:
 *
 * - In NUI (`CEF`) environments, the name is retrieved using
 *   `window.GetParentResourceName()`.
 * - In standard browser environments, the fallback `"nui-frame-app"`
 *   is used.
 * - In game runtimes, the value is retrieved from `GetCurrentResourceName()`.
 *
 * This value is typically used for logging, event namespacing,
 * and resource-aware diagnostics.
 */
export const ResourceName = IsBrowser
  ? IsBrowser === 1
    ? window.GetParentResourceName()
    : 'nui-frame-app'
  : GetCurrentResourceName();

/**
 * Development-only resource path override.
 * Defined only in dev builds via the `$DEV` label.
 */
let _devResourcePath;
$DEV: {
  _devResourcePath = "./dist"; 
}

/**
 * Base resource path used when resolving local resource files.
 *
 * In development builds (`$DEV`), this points to the compiled output
 * directory (`"./dist"`). In production builds, it defaults to the
 * resource root (`"."`).
 *
 * This allows code to reference files consistently across both
 * development and packaged environments.
 */
export const ResourcePath = _devResourcePath ?? ".";