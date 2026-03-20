import { addAce } from './acl';
import type {
  RawCommandArgs,
  CommandParam,
  CommandProperties,
  ParamsToArgs,
  CommandParamType,
} from '../../common/types/commands';
import { getEventSource } from '@common/utils/resource';

const registeredCommands: Array<CommandProperties<any>> = [];
let shouldSendCommands = false;

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

  const parsedArgs: Record<string, unknown> = {};

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
        const s = String(arg ?? '').trim();
        value = s.length > 0 ? s : undefined;
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
        const rest: string[] = [];

        for (let i = index; i in args; i++) {
          const part = args[i];
          if (part === undefined || part === null) continue;
          rest.push(String(part));
        }

        value = rest.length ? rest.join(' ') : undefined;
        break;
      }

      default: {
        value = arg;
        break;
      }
    }

    const argProvided = arg !== undefined && arg !== null && String(arg).length > 0;
    const required = !param.optional;

    if (value === undefined && (required || (param.optional && argProvided))) {
      Citizen.trace(
        `^1command '${raw.split(' ')[0] || raw}' received an invalid ${param.paramType} for argument ${index + 1} (${param.name}), received '${String(arg)}'^0`,
      );
      return false;
    }

    parsedArgs[param.name] = value;

    return true;
  });

  return ok ? (parsedArgs as any) : undefined;
}

/**
 * Registers a command that can be executed by players or the server console.
 *
 * The command callback receives:
 *
 * - `source` – the player id that executed the command (0 when run from console)
 * - `args` – parsed command arguments
 * - `raw` – the full raw command string
 *
 * Command arguments can be described using the `params` property. When
 * `params` is provided as `as const`, the callback argument type will be
 * inferred from the parameter definitions.
 *
 * Commands may also define help text and other metadata through the
 * `properties` object. When provided, these properties are automatically
 * used for chat suggestions.
 *
 * @typeParam P - Parameter definition tuple used to infer the callback argument type.
 * @param commandName - Command name or array of aliases.
 * @param cb - Function executed when the command is run.
 * @param properties - Optional command configuration and metadata.
 *
 * @example
 * ```ts
 * addCommand(
 *   'tp',
 *   (source, args) => {
 *     const player = args.player;
 *     const x = args.x;
 *   },
 *   {
 *     help: 'Teleport a player',
 *     params: [
 *       { name: 'player', paramType: 'playerId' },
 *       { name: 'x', paramType: 'number' }
 *     ] as const
 *   }
 * );
 * ```
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
