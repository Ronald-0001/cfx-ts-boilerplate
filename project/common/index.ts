import { ResourceContext } from './utils/resource';
import { logger } from './utils/logging';
import { TestEnviroments, TestUtils } from './utilTester';

export function Greetings() {
  logger.debug(`started dist/${ResourceContext}.js`);
  $DEV: TestEnviroments();
  $DEV: TestUtils();
}