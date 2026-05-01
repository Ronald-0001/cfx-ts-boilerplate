import { ResourceContext } from '@common/resource';
import { logger } from '@common/logging';
import { TestEnviroments, TestUtils } from '@common/utilTester';

export function Greetings() {
  logger.debug(`started dist/${ResourceContext}.js`);
  $DEV: TestEnviroments();
  $DEV: TestUtils();
}