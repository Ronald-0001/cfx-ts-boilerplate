import { ResourceContext } from './utils/resource';

export function Greetings() {
  console.log(`started dist/${ResourceContext}.js`);

  $SERVER: {
    console.log('COMMON: Server build active');
  }

  $CLIENT: {
    console.log('COMMON: Client build active');
  }

  $BROWSER: {
    console.log('COMMON: Web build active');
  }

  $DEV: {
    console.log('COMMON: Dev only log');
  }

  console.log('Hello from the common module!');
}
