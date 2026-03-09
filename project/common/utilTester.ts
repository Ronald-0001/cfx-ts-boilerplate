import { createLogger, createNetTransport, logger } from './utils/logging';
import { t, tk } from './utils/language';

export function TestEnviroments() {
  $SERVER: logger.info('COMMON: Server build active');
  $CLIENT: logger.info('COMMON: Client build active');
  $BROWSER: logger.info('COMMON: Browser build active');
  $DEV: logger.info('COMMON: Dev build active');
  logger.info('Hello from the common module!');
}

export function TestUtils() {
  logger.error('test error', new Error("some error!"));
    
  const testLogger = createLogger({
    // default to GetCurrentResourceName()
    resource: "testLogger",
    // prints before [resource]
    prefix: "ex",
    // prints after the [resource]
    scope: "database",
    // logLevel to print "trace" | "fatal" | "error" | "warn" | "info" | "debug"
    level: "trace", // trace is the lowest and will print all!
    // should post data to ex a logger resource using emit?
    transport: createNetTransport("test:event", false), // event, emitNet or local emit?
    // should the script throw error on fatal logs?
    fatalThrows: false,
  });
  testLogger.fatal("some test error", new Error("does this throw?"))

  $DEV: logger.debug(t('common.hello')); // "Hello, world!" automaticly load "common.world"!
  $DEV: logger.debug(t('common.hello', { 'common.world': 'everyone' })); // can be overwritten but awkward
  $DEV: logger.debug(t('common.greeting', { name: 'John' })); // "Hello, John!"
  $DEV: logger.debug(t('common.greeting', { name: undefined })); // "Hello, {name}!" in case of missing args...
  $DEV: logger.debug(t('common.greet', { rest: 'everyone' })); // loads $(common.world) and replaces {rest} with everyone
  $DEV: logger.debug(t('common.missingRef')); // "Hello, $(common.doesNotExist)!" in cases with missing ref's
  $DEV: logger.debug(t('common.missingRef', { 'common.doesNotExist': 'John' })); // "Hello, John!" can still be overwriten
  $DEV: logger.debug(t('common.missing')); // trows missing error and returns empty string "can be tested if invalid lang..."
  $DEV: logger.debug(tk('common.missing')); // trows missing error and returns "common.missing"

  $DEV: logger.trace("just wanted to trace this i guess?", new Error());
}