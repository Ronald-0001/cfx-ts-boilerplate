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

  logger.debug(t('common.hello')); // "Hello, world!" automaticly load "common.world"!
  logger.debug(t('common.hello', { 'common.world': 'everyone' })); // can be overwritten but awkward
  logger.debug(t('common.greeting', { name: 'John' })); // "Hello, John!"
  logger.debug(t('common.greeting', { name: undefined })); // "Hello, {name}!" in case of missing args...
  logger.debug(t('common.greet', { rest: 'everyone' })); // loads $(common.world) and replaces {rest} with everyone
  logger.debug(t('common.missingRef')); // "Hello, $(common.doesNotExist)!" in cases with missing ref's
  logger.debug(t('common.missingRef', { 'common.doesNotExist': 'John' })); // "Hello, John!" can still be overwriten
  logger.debug(t('common.missing')); // trows missing error and returns empty string "can be tested if invalid lang..."
  logger.debug(tk('common.missing')); // trows missing error and returns "common.missing"
}
