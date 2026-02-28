import { stat } from 'node:fs/promises';
import { spawn } from 'node:child_process';

export async function exists(p: string): Promise<boolean> {
  try {
    await stat(p);
    return true;
  } catch {
    return false;
  }
}

export function exec(command: string): Promise<{ code: number | null; signal: NodeJS.Signals | null }> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, { stdio: 'inherit', shell: true });

    child.on('exit', (code, signal) => {
      if (code === 0) resolve({ code, signal });
      else reject(new Error(`Command "${command}" exited with code ${code} signal ${signal}`));
    });
  });
}
