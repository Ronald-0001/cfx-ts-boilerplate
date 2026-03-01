import { ResourceContext } from './utils/resource';
import { logger } from './utils/logging';

export function Greetings() {
  logger.debug(`started dist/${ResourceContext}.js`);

  $SERVER: {
    logger.trace('COMMON: Server build active');
  }

  $CLIENT: {
    logger.trace('COMMON: Client build active');
  }

  $BROWSER: {
    logger.trace('COMMON: Web build active');
  }

  $DEV: {
    logger.debug('COMMON: Dev only log');
  }

  logger.info('Hello from the common module!');
}
