/**
 * Supported parameter types for command definitions.
 *
 * Used in `params` to describe how each command argument should be handled.
 * 'number' must follow Number.isFinite(Number( arg ))
 * 'string' Must not be a number and will parse into string
 * 'playerId' if arg == "me" use callers id and will be validated with existing player ids
 * 'longString' tries to return the rest of the command as one long string!
 */
export type CommandParamType = 'number' | 'playerId' | 'string' | 'longString';

/**
 * Describes a single command argument.
 *
 * Command parameters are defined in the `params` array when registering a command.
 * Each parameter maps one positional command argument to a named property on `args`
 * inside the command callback.
 *
 * Example:
 *
 * ```ts
 * params: [
 *   { name: 'player', paramType: 'playerId' },
 *   { name: 'reason', paramType: 'longString', optional: true }
 * ] as const
 * ```
 */
export interface CommandParam<Name extends string = string, Type extends CommandParamType = CommandParamType> {/**
   * Name of the argument as it will appear on the parsed `args` object.
   *
   * Example:
   * `{ name: 'player' }` becomes `args.player`
   */
  name: Name;
  /**
   * Help text shown in chat suggestions for this argument.
   */
  help?: string;
  /**
   * Argument type used for parsing and typing.
   */
  paramType?: Type;
  /**
   * Marks the argument as optional.
   *
   * Optional parameters may be omitted by the user and will resolve to `undefined`.
   */
  optional?: boolean;
}

/**
 * Additional command configuration used when registering a command.
 *
 * This is where command help text, parameters, suggestion metadata,
 * and access restrictions are defined.
 *
 * Example:
 *
 * ```ts
 * {
 *   help: 'Teleport a player',
 *   params: [
 *     { name: 'player', paramType: 'playerId' },
 *     { name: 'x', paramType: 'number' }
 *   ] as const,
 *   restricted: 'group.admin'
 * }
 * ```
 */
export interface CommandProperties<P extends readonly CommandParam[] = readonly CommandParam[]> {
  /**
   * Display name used for chat suggestions.
   *
   * If omitted, the command name is shown as `/${command}`.
   */
  name?: string;
  /**
   * Help text shown for the command in chat suggestions.
   */
  help?: string;
  /**
   * Parameter definitions used for parsing command input and inferring
   * the callback `args` type.
   *
   * Use `as const` for best type inference.
   */
  params?: P;
  /**
   * Restriction configuration for the command.
   *
   * Use:
   *
   * - `true` to require the default `command.<name>` ace
   * - a string for a single principal (e.g. `group.admin`)
   * - a string array for multiple principals
   */
  restricted?: boolean | string | string[];
}

/**
 * Raw command argument shape used before and during parsing.
 *
 * In most cases this type does not need to be used directly when defining commands.
 * Use `params` instead to get named and typed callback arguments.
 */
export type RawCommandArgs = Record<string | number, string | number | boolean>;

/**
 * Resolves the callback argument type for a single command parameter type.
 */
export type ParamValue<T extends CommandParamType | undefined> =
  T extends 'number' ? number :
  T extends 'playerId' ? number :
  T extends 'string' ? string :
  T extends 'longString' ? string :
  string;

/**
 * Converts a `params` definition into the named `args` object
 * received by the command callback.
 *
 * Example:
 *
 * ```ts
 * params: [
 *   { name: 'player', paramType: 'playerId' },
 *   { name: 'amount', paramType: 'number', optional: true }
 * ] as const
 * ```
 *
 * becomes:
 *
 * ```ts
 * {
 *   player: number;
 *   amount: number | undefined;
 * }
 * ```
 */
export type ParamsToArgs<P extends readonly CommandParam[]> = {
  [K in P[number] as K['name']]:
    K['optional'] extends true
      ? ParamValue<K['paramType']> | undefined
      : ParamValue<K['paramType']>;
};