import { ResourceName, IsBrowser, ResourcePath } from './resource';

/**
 * Loads a file from the current resource.
 *
 * This is a thin wrapper around `LoadResourceFile` that automatically
 * resolves the correct resource name and base path.
 *
 * The returned value is the raw file contents as a string.
 *
 * @param path - Path to the file relative to the resource root.
 * @returns The file contents as a string.
 */
export function LoadFile(path: string) {
  return LoadResourceFile(ResourceName, `${ResourcePath}/${path}`);
}

// TODO: need to ensure loading correct path in browser!
// remember to update files.md when changing this function in future
/**
 * Loads and parses a JSON file from the resource.
 *
 * Runtime behavior differs depending on the execution environment:
 *
 * - **Game runtime (client/server)**: The file is loaded using
 *   `LoadResourceFile` and parsed synchronously.
 *
 * - **Browser / NUI runtime**: The file is fetched using `fetch`
 *   and resolved asynchronously.
 *
 * @typeParam T - Expected shape of the parsed JSON object.
 * @param path - Path to the JSON file relative to the resource root.
 * @returns Parsed JSON data.
 */
export function LoadJsonFile<T = unknown>(path: string): T {
  if (!IsBrowser) return JSON.parse(LoadFile(path)) as T;

  const resp = fetch(`/${ResourcePath.replace(".", "")}${path}`, {
    method: 'post',
    headers: {
      'Content-Type': 'application/json; charset=UTF-8',
    },
  });

  return resp.then((response) => response.json()) as T;
}
