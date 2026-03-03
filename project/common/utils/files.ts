import { ResourceName, IsBrowser, ResourcePath } from './resource';

export function LoadFile(path: string) {
  return LoadResourceFile(ResourceName, `${ResourcePath}/${path}`);
}

//TODO: need to ensure loading correct path in browser!
// remember to update files.md when changing this function in future
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
