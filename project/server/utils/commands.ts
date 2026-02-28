import { addAce } from './acl';
import type {
  RawCommandArgs,
  CommandParam,
  CommandProperties,
  ParamsToArgs,
  CommandParamType,
} from '../../common/types/commands';

const registeredCommands: Array<CommandProperties<any>> = [];
let shouldSendCommands = false;

function getEventSource(): number {
  // FiveM server provides `source` as a global inside event handlers
  return (globalThis as any).source as number;
}

setTimeout(() => {
  shouldSendCommands = true;
  emitNet('chat:addSuggestions', -1, registeredCommands);
}, 1000);

on('playerJoining', () => {
  const src = getEventSource();
  emitNet('chat:addSuggestions', src, registeredCommands);
});

function doesPlayerExist(id: number): boolean {
  // DoesPlayerExist expects string in JS runtime
  return DoesPlayerExist(String(id));
}

function parseArguments<P extends readonly CommandParam[]>(
  source: number,
  args: RawCommandArgs,
  raw: string,
  params?: P,
): (RawCommandArgs & ParamsToArgs<P>) | undefined {
  if (!params?.length) return args as any;

  const ok = params.every((param, index) => {
    const arg = args[index];
    let value: any;

    switch (param.paramType as CommandParamType | undefined) {
      case 'number': {
        value = typeof arg === 'string' || typeof arg === 'number' ? Number(arg) : NaN;
        if (!Number.isFinite(value)) value = undefined;
        break;
      }

      case 'string': {
        // require non-numeric string (mirrors ox-ish behavior)
        const s = String(arg ?? '');
        value = Number.isFinite(Number(s)) ? undefined : s;
        break;
      }

      case 'playerId': {
        if (arg === 'me') {
          value = source;
        } else {
          const n = Number(arg);
          value = Number.isFinite(n) ? n : undefined;
        }
        if (value !== undefined && !doesPlayerExist(value)) value = undefined;
        break;
      }

      case 'longString': {
        const s = String(arg ?? '');
        // substring from first occurrence of the token
        value = raw.substring(raw.indexOf(s));
        break;
      }

      default: {
        value = arg;
        break;
      }
    }

    // Validation rule:
    // - if missing/invalid AND param is not optional -> fail
    // - if optional AND arg not provided -> allow (value may be undefined)
    const argProvided = arg !== undefined && arg !== null && String(arg).length > 0;
    const required = !param.optional;

    if (value === undefined && (required || (param.optional && argProvided))) {
      Citizen.trace(
        `^1command '${raw.split(' ')[0] || raw}' received an invalid ${param.paramType} for argument ${index + 1} (${param.name}), received '${String(arg)}'^0`,
      );
      return false;
    }

    // Move positional arg to named key
    (args as any)[param.name] = value;
    delete (args as any)[index];

    return true;
  });

  return ok ? (args as any) : undefined;
}

/**
 * Strongly-typed command registration.
 *
 * ✅ If you pass `params` as `as const`, the `args` type is inferred from param names + types.
 *
 * Example:
 * addCommand(
 *   'tp',
 *   async (src, args) => { args.player; args.x; },
 *   { params: [{ name:'player', paramType:'playerId' }, { name:'x', paramType:'number' }] as const }
 * )
 */
export function addCommand<const P extends readonly CommandParam[] | undefined>(
  commandName: string | string[],
  cb: (
    source: number,
    args: P extends readonly CommandParam[] ? ParamsToArgs<P> : RawCommandArgs,
    raw: string,
  ) => Promise<any> | any,
  properties?: CommandProperties<P extends readonly CommandParam[] ? P : readonly CommandParam[]>,
) {
  const restricted = properties?.restricted;
  const params = properties?.params as P;

  // decorate param help with type info for chat suggestions
  if (params && Array.isArray(params)) {
    params.forEach((param) => {
      if (param.paramType) {
        param.help = param.help ? `${param.help} (type: ${param.paramType})` : `(type: ${param.paramType})`;
      }
    });
  }

  const commands = Array.isArray(commandName) ? commandName : [commandName];
  const numCommands = commands.length;

  const commandHandler = (source: number, args: RawCommandArgs, raw: string) => {
    const parsed = parseArguments(source, args, raw, params as any);
    if (!parsed) return;

    Promise.resolve(cb(source, parsed as any, raw)).catch((e) => {
      Citizen.trace(`^1command '${raw.split(' ')[0] || raw}' failed to execute!^0\n${e?.message ?? String(e)}`);
    });
  };

  commands.forEach((cmd, index) => {
    RegisterCommand(cmd, commandHandler, !!restricted);

    if (restricted) {
      const ace = `command.${cmd}`;
      const t = typeof restricted;

      if (t === 'string' && !IsPrincipalAceAllowed(restricted as string, ace)) {
        addAce(restricted as string, ace, true);
      } else if (t === 'object') {
        for (const principal of restricted as string[]) {
          if (!IsPrincipalAceAllowed(principal, ace)) addAce(principal, ace, true);
        }
      }
    }

    if (properties) {
      const sug: any = { ...properties, name: `/${cmd}` };
      delete sug.restricted;

      registeredCommands.push(sug);

      // if multiple commands share base props, clone between pushes
      if (index !== numCommands - 1 && numCommands !== 1) properties = { ...(properties as any) };

      if (shouldSendCommands) emitNet('chat:addSuggestions', -1, sug);
    }
  });
}
