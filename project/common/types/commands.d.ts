export type CommandParamType = 'number' | 'playerId' | 'string' | 'longString';

export interface CommandParam<Name extends string = string, Type extends CommandParamType = CommandParamType> {
  name: Name;
  help?: string;
  paramType?: Type;
  optional?: boolean;
}

export interface CommandProperties<P extends readonly CommandParam[] = readonly CommandParam[]> {
  /** Override display name for chat suggestions. If omitted, defaults to `/${command}` */
  name?: string;
  help?: string;
  params?: P;
  /**
   * - true: command is restricted and requires ace `command.<name>`
   * - string: principal (e.g. `group.admin`)
   * - string[]: principals
   */
  restricted?: boolean | string | string[];
}

/** Base args shape used internally (positional indices + named params after parse) */
export type RawCommandArgs = Record<string | number, string | number | boolean>;

export type ParamValue<T extends CommandParamType | undefined> =
  T extends 'number' ? number :
  T extends 'playerId' ? number :
  T extends 'string' ? string :
  T extends 'longString' ? string :
  string;

export type ParamsToArgs<P extends readonly CommandParam[]> = {
  [K in P[number] as K['name']]:
    K['optional'] extends true
      ? ParamValue<K['paramType']> | undefined
      : ParamValue<K['paramType']>;
};