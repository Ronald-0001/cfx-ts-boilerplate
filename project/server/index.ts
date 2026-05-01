import Config from '@common/config';
import { Greetings } from '~common/index';
import { addCommand } from '@server/command';
import { logger } from '@common/logging';

$DEV: logger.debug('Loaded config', Config);

Greetings();

addCommand(
  'tp',
  async (src, args) => {
    logger.info('Teleport command executed', { src, args });
    // args is fully typed:
    // args.target -> number
    // args.x/y/z -> number
  },
  {
    help: 'Teleport a player',
    restricted: 'group.admin',
    params: [
      { name: 'target', paramType: 'playerId' },
      { name: 'x', paramType: 'number' },
      { name: 'y', paramType: 'number' },
      { name: 'z', paramType: 'number', optional: true },
    ] as const,
  },
);
