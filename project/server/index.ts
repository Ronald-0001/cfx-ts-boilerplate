import Config from '@common/utils/config';
import { Greetings } from '@common/index';
import { addCommand } from './utils/commands';

Greetings();

if (Config.Debug?.enabled) {
  // needs propper command manager...
  // addCommand('openNui', async (playerId) => {
  //   if (!playerId) return;
  //   emitNet(`${GetCurrentResourceName()}:openNui`, playerId);
  // });
}

addCommand(
  'tp',
  async (src, args) => {
    // args is fully typed:
    // args.target -> number
    // args.x/y/z -> number
    console.log(src, args.target, args.x, args.y, args.z);
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
