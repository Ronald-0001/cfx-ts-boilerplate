import { ResourceContext } from './utils/resource';
import { logger } from './utils/logging';
import { t, tk } from './utils/language';

export function Greetings() {
  logger.debug(`started dist/${ResourceContext}.js`);
  $SERVER: logger.trace('COMMON: Server build active');
  $CLIENT: logger.trace('COMMON: Client build active');
  $BROWSER: logger.trace('COMMON: Browser build active');
  $DEV: logger.trace('COMMON: Dev build active');
  logger.trace('Hello from the common module!');

  logger.debug(t('common.hello')); // "Hello, world!"
  logger.debug(t('common.greeting', { name: 'John' })); // "Hello, John!"
  logger.debug(t('common.hello', { 'common.world': 'everyone' })); // also works but awkward
  logger.debug(t('common.hello', { world: 'everyone' })); // if you use $(world) instead of $(common.world)
  logger.debug(t('common.missing')); // trows missing error and returns ""
  logger.debug(tk('common.missing')); // trows missing error and returns "common.missing"
}
