import { ResourceContext } from './utils/resource';
import { logger } from './utils/logging';

export function Greetings() {
  logger.debug(`started dist/${ResourceContext}.js`);
  $SERVER: logger.trace('COMMON: Server build active');
  $CLIENT: logger.trace('COMMON: Client build active');
  $BROWSER: logger.trace('COMMON: Browser build active');
  $DEV: logger.trace('COMMON: Dev build active');
  logger.trace('Hello from the common module!');
}
