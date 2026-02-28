import { readFile } from 'fs/promises';
import type { z } from 'zod';

export async function readJsonZod<S extends z.ZodTypeAny>(path: string, schema: S): Promise<z.infer<S>> {
  const raw = await readFile(path, 'utf8');
  const data = JSON.parse(raw);
  return schema.parse(data);
}
